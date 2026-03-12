// ConnectWise sync functions — fetches data from CW API and upserts into Supabase
// Features: idempotent sync_id tracking, delta sync, retry queue, metrics

import { ConnectWiseClient } from "./client";
import { createLogger, withTiming } from "@/lib/logger";
import { invalidateAllCaches } from "@/lib/repositories/cached";
import type {
  CWCompany,
  CWTicket,
  CWAgreement,
  CWConfiguration,
  CWSyncResult,
  SyncRunMeta,
  SyncRetryEntry,
} from "./types";

const log = createLogger("connectwise:sync");

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

type EntityType = "companies" | "tickets" | "agreements" | "hardware";

type SyncFunction = (client: ConnectWiseClient, lastSyncAt: string | null) => Promise<CWSyncResult>;

const SYNC_ENTITIES: Array<{ entity: EntityType; fn: SyncFunction }> = [
  { entity: "companies", fn: syncCompanies },
  { entity: "tickets", fn: syncTickets },
  { entity: "agreements", fn: syncAgreements },
  { entity: "hardware", fn: syncConfigurations },
];

/**
 * Transforms CW ticket status to our internal status.
 */
function mapTicketStatus(status?: string, closedFlag?: boolean): "open" | "in_progress" | "closed" {
  if (closedFlag) return "closed";
  if (!status) return "open";
  const lower = status.toLowerCase();
  if (lower.includes("close") || lower.includes("resolved")) return "closed";
  if (lower.includes("progress") || lower.includes("work")) return "in_progress";
  return "open";
}

/**
 * Transforms CW priority to our internal priority.
 */
function mapPriority(priority?: string): "urgent" | "high" | "normal" | "low" {
  if (!priority) return "normal";
  const lower = priority.toLowerCase();
  if (lower.includes("urgent") || lower.includes("critical")) return "urgent";
  if (lower.includes("high")) return "high";
  if (lower.includes("low")) return "low";
  return "normal";
}

/**
 * Transforms CW configuration type name to our internal type.
 */
function mapConfigType(name?: string): "Desktop" | "Laptop" | "Server" | "Netwerk" | "Overig" {
  if (!name) return "Overig";
  const lower = name.toLowerCase();
  if (lower.includes("desktop") || lower.includes("workstation")) return "Desktop";
  if (lower.includes("laptop") || lower.includes("notebook")) return "Laptop";
  if (lower.includes("server")) return "Server";
  if (lower.includes("netwerk") || lower.includes("network") || lower.includes("switch") || lower.includes("router") || lower.includes("firewall")) return "Netwerk";
  return "Overig";
}

function mapAgreementStatus(cancelled: boolean, endDate?: string): "active" | "expired" | "cancelled" {
  if (cancelled) return "cancelled";
  if (endDate && new Date(endDate) < new Date()) return "expired";
  return "active";
}

/**
 * Gets the last successful sync timestamp for an entity type.
 */
async function getLastSyncTimestamp(entity: EntityType): Promise<string | null> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("sync_logs")
    .select("completed_at")
    .eq("entity_type", entity)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .returns<Array<{ completed_at: string | null }>>();

  const firstRow = data?.[0];
  return firstRow?.completed_at ?? null;
}

/**
 * Creates a sync log entry in the database.
 */
async function createSyncLog(entity: EntityType, syncId: string): Promise<string | null> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sync_logs")
    .insert({
      entity_type: entity,
      status: "running" as const,
      records_synced: 0,
      records_failed: 0,
      started_at: new Date().toISOString(),
      error_message: `sync_id:${syncId}`,
    })
    .select("id")
    .single();

  if (error) {
    log.warn("Failed to create sync log", { entity, error: error.message });
    return null;
  }

  return data?.id ?? null;
}

/**
 * Updates a sync log entry with results.
 */
async function updateSyncLog(
  logId: string,
  status: "completed" | "failed",
  synced: number,
  failed: number,
  errorMessage?: string
): Promise<void> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  await supabase
    .from("sync_logs")
    .update({
      status,
      records_synced: synced,
      records_failed: failed,
      completed_at: new Date().toISOString(),
      error_message: errorMessage ?? null,
    })
    .eq("id", logId);
}

/**
 * Checks if a sync with the given ID is already running or completed.
 * Prevents duplicate syncs.
 */
async function isSyncIdempotent(syncId: string): Promise<boolean> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("sync_logs")
    .select("id")
    .like("error_message", `sync_id:${syncId}%`)
    .eq("status", "completed")
    .limit(1)
    .returns<Array<{ id: string }>>();

  return (data?.length ?? 0) > 0;
}

/**
 * Builds a CW conditions string for delta sync.
 * Uses lastUpdated filter to only fetch records changed since last sync.
 */
function buildDeltaCondition(lastSyncAt: string | null): string | undefined {
  if (!lastSyncAt) return undefined;
  // CW API conditions format: lastUpdated > [ISO timestamp]
  return `lastUpdated > [${lastSyncAt}]`;
}

/**
 * Computes sync metrics from result data.
 */
function computeMetrics(result: Omit<CWSyncResult, "records_per_second">): CWSyncResult {
  const durationSec = result.duration_ms / 1000;
  const recordsPerSecond = durationSec > 0
    ? Math.round(result.total_fetched / durationSec)
    : result.total_fetched;

  return {
    ...result,
    records_per_second: recordsPerSecond,
  };
}

/**
 * Retries a failed sync entity with exponential backoff.
 */
async function retryEntity(
  client: ConnectWiseClient,
  entityConfig: { entity: EntityType; fn: SyncFunction },
  lastSyncAt: string | null,
  attempt: number
): Promise<CWSyncResult | null> {
  if (attempt > MAX_RETRIES) return null;

  const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
  await new Promise((resolve) => setTimeout(resolve, delay));

  log.info(`Retrying sync for ${entityConfig.entity}`, { attempt, maxRetries: MAX_RETRIES });

  try {
    return await entityConfig.fn(client, lastSyncAt);
  } catch {
    log.warn(`Retry ${attempt} failed for ${entityConfig.entity}`);
    return retryEntity(client, entityConfig, lastSyncAt, attempt + 1);
  }
}

/**
 * Runs a full or delta sync of all entities from ConnectWise to Supabase.
 *
 * Features:
 * - Idempotent: tracks sync_id per run, skips if already completed
 * - Delta sync: only fetches records changed since last successful sync
 * - Retry queue: failed entities are retried up to MAX_RETRIES times
 * - Metrics: tracks duration, records/second, error rate per entity
 * - Sync logging: creates sync_logs entries for monitoring
 *
 * @param syncId Optional idempotency key — if provided, prevents duplicate runs
 */
export async function syncAll(syncId?: string): Promise<SyncRunMeta> {
  const runId = syncId ?? crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const runStart = Date.now();

  const client = new ConnectWiseClient();

  if (!client.isConfigured()) {
    log.info("Sync skipped — ConnectWise API not configured");
    return {
      sync_id: runId,
      started_at: startedAt,
      entity_results: [],
      total_duration_ms: 0,
      total_synced: 0,
      total_errors: 0,
      retry_queue: [],
    };
  }

  // Idempotency check: skip if this sync_id already completed
  if (syncId) {
    const alreadyDone = await isSyncIdempotent(syncId);
    if (alreadyDone) {
      log.info("Sync skipped — sync_id already completed", { syncId });
      return {
        sync_id: runId,
        started_at: startedAt,
        entity_results: [],
        total_duration_ms: 0,
        total_synced: 0,
        total_errors: 0,
        retry_queue: [],
      };
    }
  }

  const results: CWSyncResult[] = [];
  const retryQueue: SyncRetryEntry[] = [];

  for (const entityConfig of SYNC_ENTITIES) {
    const { entity, fn } = entityConfig;

    // Delta sync: get last successful sync timestamp
    const lastSyncAt = await getLastSyncTimestamp(entity);
    if (lastSyncAt) {
      log.info(`Delta sync for ${entity}`, { lastSyncAt });
    }

    // Create sync log entry
    const logId = await createSyncLog(entity, runId);

    try {
      const result = await fn(client, lastSyncAt);

      log.info(`Synced ${entity}`, {
        synced: result.synced,
        errors: result.errors,
        skipped: result.skipped,
        totalFetched: result.total_fetched,
        recordsPerSecond: result.records_per_second,
        durationMs: result.duration_ms,
        mode: lastSyncAt ? "delta" : "full",
      });

      if (logId) {
        await updateSyncLog(logId, "completed", result.synced, result.errors);
      }

      results.push(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      log.warn(`Sync failed for ${entity}, queuing for retry`, { error: errorMsg });

      if (logId) {
        await updateSyncLog(logId, "failed", 0, 0, errorMsg);
      }

      // Try retry
      const retryResult = await retryEntity(client, entityConfig, lastSyncAt, 1);

      if (retryResult) {
        log.info(`Retry succeeded for ${entity}`, { synced: retryResult.synced });
        results.push(retryResult);
      } else {
        retryQueue.push({
          entity,
          error_message: errorMsg,
          failed_at: new Date().toISOString(),
        });
      }
    }
  }

  // Invalidate all caches after sync — data has changed
  if (results.length > 0) {
    invalidateAllCaches();
  }

  const totalDurationMs = Date.now() - runStart;
  const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

  log.info("Sync run completed", {
    syncId: runId,
    totalDurationMs,
    totalSynced,
    totalErrors,
    retryQueueSize: retryQueue.length,
    mode: "mixed",
  });

  return {
    sync_id: runId,
    started_at: startedAt,
    entity_results: results,
    total_duration_ms: totalDurationMs,
    total_synced: totalSynced,
    total_errors: totalErrors,
    retry_queue: retryQueue,
  };
}

/**
 * Builds a company ID lookup map for batch resolution.
 * Eliminates N+1 queries when syncing tickets/agreements/configs.
 */
async function buildCompanyLookup(): Promise<Map<number, string>> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("companies")
    .select("id, cw_company_id")
    .returns<Array<{ id: string; cw_company_id: number | null }>>();

  const lookup = new Map<number, string>();
  if (data) {
    for (const row of data) {
      if (row.cw_company_id !== null) {
        lookup.set(row.cw_company_id, row.id);
      }
    }
  }
  return lookup;
}

async function syncCompanies(client: ConnectWiseClient, lastSyncAt: string | null): Promise<CWSyncResult> {
  return withTiming(log, "syncCompanies", async () => {
    const start = Date.now();
    let synced = 0;
    let errors = 0;
    const skipped = 0;

    const condition = buildDeltaCondition(lastSyncAt);
    const companies = await client.get<CWCompany>("/company/companies", undefined, condition);
    const totalFetched = companies.length;

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    for (const cw of companies) {
      const { error } = await supabase.from("companies").upsert(
        {
          cw_company_id: cw.id,
          name: cw.name,
          employee_count: cw.numberOfEmployees ?? null,
          industry: cw.market?.name ?? null,
        },
        { onConflict: "cw_company_id" }
      );

      if (error) {
        errors++;
      } else {
        synced++;
      }
    }

    return computeMetrics({
      entity: "companies",
      synced,
      errors,
      skipped,
      duration_ms: Date.now() - start,
      total_fetched: totalFetched,
    });
  });
}

async function syncTickets(client: ConnectWiseClient, lastSyncAt: string | null): Promise<CWSyncResult> {
  return withTiming(log, "syncTickets", async () => {
    const start = Date.now();
    let synced = 0;
    let errors = 0;
    let skipped = 0;

    const condition = buildDeltaCondition(lastSyncAt);
    const tickets = await client.get<CWTicket>("/service/tickets", undefined, condition);
    const totalFetched = tickets.length;

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Build company lookup to avoid N+1
    const companyLookup = await buildCompanyLookup();

    for (const cw of tickets) {
      const cwCompanyId = cw.company?.id;
      if (!cwCompanyId) {
        skipped++;
        continue;
      }

      const companyId = companyLookup.get(cwCompanyId);
      if (!companyId) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("tickets").upsert(
        {
          company_id: companyId,
          cw_ticket_id: cw.id,
          summary: cw.summary,
          status: mapTicketStatus(cw.status?.name, cw.closedFlag),
          priority: mapPriority(cw.priority?.name),
          contact_name: cw.contact?.name ?? null,
          source: cw.source?.name ?? null,
          is_closed: cw.closedFlag,
          cw_created_at: cw._info?.dateEntered ?? null,
          cw_updated_at: cw._info?.lastUpdated ?? null,
        },
        { onConflict: "cw_ticket_id" }
      );

      if (error) {
        errors++;
      } else {
        synced++;
      }
    }

    return computeMetrics({
      entity: "tickets",
      synced,
      errors,
      skipped,
      duration_ms: Date.now() - start,
      total_fetched: totalFetched,
    });
  });
}

async function syncAgreements(client: ConnectWiseClient, lastSyncAt: string | null): Promise<CWSyncResult> {
  return withTiming(log, "syncAgreements", async () => {
    const start = Date.now();
    let synced = 0;
    let errors = 0;
    let skipped = 0;

    const condition = buildDeltaCondition(lastSyncAt);
    const agreements = await client.get<CWAgreement>("/finance/agreements", undefined, condition);
    const totalFetched = agreements.length;

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Build company lookup to avoid N+1
    const companyLookup = await buildCompanyLookup();

    for (const cw of agreements) {
      const cwCompanyId = cw.company?.id;
      if (!cwCompanyId) {
        skipped++;
        continue;
      }

      const companyId = companyLookup.get(cwCompanyId);
      if (!companyId) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("agreements").upsert(
        {
          company_id: companyId,
          cw_agreement_id: cw.id,
          name: cw.name,
          type: cw.type?.name ?? null,
          status: mapAgreementStatus(cw.cancelledFlag, cw.endDate),
          bill_amount: cw.billAmount ?? null,
          start_date: cw.startDate ?? null,
          end_date: cw.endDate ?? null,
        },
        { onConflict: "cw_agreement_id" }
      );

      if (error) {
        errors++;
      } else {
        synced++;
      }
    }

    return computeMetrics({
      entity: "agreements",
      synced,
      errors,
      skipped,
      duration_ms: Date.now() - start,
      total_fetched: totalFetched,
    });
  });
}

async function syncConfigurations(client: ConnectWiseClient, lastSyncAt: string | null): Promise<CWSyncResult> {
  return withTiming(log, "syncConfigurations", async () => {
    const start = Date.now();
    let synced = 0;
    let errors = 0;
    let skipped = 0;

    const condition = buildDeltaCondition(lastSyncAt);
    const configs = await client.get<CWConfiguration>("/company/configurations", undefined, condition);
    const totalFetched = configs.length;

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Build company lookup to avoid N+1
    const companyLookup = await buildCompanyLookup();

    for (const cw of configs) {
      const cwCompanyId = cw.company?.id;
      if (!cwCompanyId) {
        skipped++;
        continue;
      }

      const companyId = companyLookup.get(cwCompanyId);
      if (!companyId) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("hardware_assets").upsert(
        {
          company_id: companyId,
          cw_config_id: cw.id,
          name: cw.name,
          type: mapConfigType(cw.type?.name),
          manufacturer: cw.manufacturer?.name ?? null,
          model: cw.model ?? null,
          serial_number: cw.serialNumber ?? null,
          assigned_to: cw.contact?.name ?? null,
          warranty_expiry: cw.warrantyExpirationDate ?? null,
        },
        { onConflict: "cw_config_id" }
      );

      if (error) {
        errors++;
      } else {
        synced++;
      }
    }

    return computeMetrics({
      entity: "hardware_assets",
      synced,
      errors,
      skipped,
      duration_ms: Date.now() - start,
      total_fetched: totalFetched,
    });
  });
}

// Export mapping functions for testing
export { mapTicketStatus, mapPriority, mapAgreementStatus };
