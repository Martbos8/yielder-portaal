// ConnectWise sync functions — fetches data from CW API and upserts into Supabase
// In demo mode (no API keys), logs a message and returns early
// Each entity syncs independently — one failure doesn't stop others

import { ConnectWiseClient } from "./client";
import type {
  CWCompany,
  CWTicket,
  CWAgreement,
  CWConfiguration,
  CWSyncResult,
} from "./types";
import type { SyncEntityType } from "@/types/database";

/**
 * Transforms CW ticket status to our internal status.
 */
function mapTicketStatus(status?: string, closedFlag?: boolean): string {
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
function mapPriority(priority?: string): string {
  if (!priority) return "normal";
  const lower = priority.toLowerCase();
  if (lower.includes("urgent") || lower.includes("critical")) return "urgent";
  if (lower.includes("high")) return "high";
  if (lower.includes("low")) return "low";
  return "normal";
}

/**
 * Transforms CW agreement to determine status.
 */
function mapAgreementStatus(cancelled: boolean, endDate?: string): string {
  if (cancelled) return "cancelled";
  if (endDate && new Date(endDate) < new Date()) return "expired";
  return "active";
}

/**
 * Insert a sync_log row with status "running".
 * Returns the log ID for later update.
 */
async function startSyncLog(entityType: SyncEntityType): Promise<string | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("sync_logs")
      .insert({
        entity_type: entityType,
        status: "running",
        records_synced: 0,
        records_failed: 0,
      })
      .select("id")
      .single();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Update a sync_log row with final status.
 */
async function completeSyncLog(
  logId: string | null,
  status: "completed" | "failed",
  synced: number,
  failed: number,
  errorMessage?: string
): Promise<void> {
  if (!logId) return;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase
      .from("sync_logs")
      .update({
        status,
        records_synced: synced,
        records_failed: failed,
        error_message: errorMessage ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", logId);
  } catch {
    // Silent fail — sync logging should never break sync
  }
}

/**
 * Runs a full sync of all entities from ConnectWise to Supabase.
 * Each entity syncs independently — partial failures don't block other entities.
 * Returns early in demo mode (no API keys configured).
 */
export async function syncAll(): Promise<CWSyncResult[]> {
  const client = new ConnectWiseClient();

  if (!client.isConfigured()) {
    return [];
  }

  const results: CWSyncResult[] = [];

  // Each sync runs independently — failure in one doesn't stop others
  const syncFns = [
    () => syncCompanies(client),
    () => syncTickets(client),
    () => syncAgreements(client),
    () => syncConfigurations(client),
  ];

  for (const fn of syncFns) {
    try {
      results.push(await fn());
    } catch {
      // Individual entity sync failed — continue with others
    }
  }

  return results;
}

async function syncCompanies(client: ConnectWiseClient): Promise<CWSyncResult> {
  const start = Date.now();
  const logId = await startSyncLog("companies");
  let synced = 0;
  let errors = 0;

  try {
    const companies = await client.get<CWCompany>("/company/companies");

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

    await completeSyncLog(logId, "completed", synced, errors);
  } catch (err) {
    await completeSyncLog(logId, "failed", synced, errors + 1,
      err instanceof Error ? err.message : "Unknown error");
    errors++;
  }

  return { entity: "companies", synced, errors, skipped: 0, duration_ms: Date.now() - start };
}

async function syncTickets(client: ConnectWiseClient): Promise<CWSyncResult> {
  const start = Date.now();
  const logId = await startSyncLog("tickets");
  let synced = 0;
  let errors = 0;

  try {
    const tickets = await client.get<CWTicket>("/service/tickets");

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    for (const cw of tickets) {
      const companyId = cw.company?.id;
      if (!companyId) {
        errors++;
        continue;
      }

      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("cw_company_id", companyId)
        .single();

      if (!company) {
        errors++;
        continue;
      }

      const { error } = await supabase.from("tickets").upsert(
        {
          company_id: company.id,
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

    await completeSyncLog(logId, "completed", synced, errors);
  } catch (err) {
    await completeSyncLog(logId, "failed", synced, errors + 1,
      err instanceof Error ? err.message : "Unknown error");
    errors++;
  }

  return { entity: "tickets", synced, errors, skipped: 0, duration_ms: Date.now() - start };
}

async function syncAgreements(client: ConnectWiseClient): Promise<CWSyncResult> {
  const start = Date.now();
  const logId = await startSyncLog("agreements");
  let synced = 0;
  let errors = 0;

  try {
    const agreements = await client.get<CWAgreement>("/finance/agreements");

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    for (const cw of agreements) {
      const companyId = cw.company?.id;
      if (!companyId) {
        errors++;
        continue;
      }

      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("cw_company_id", companyId)
        .single();

      if (!company) {
        errors++;
        continue;
      }

      const { error } = await supabase.from("agreements").upsert(
        {
          company_id: company.id,
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

    await completeSyncLog(logId, "completed", synced, errors);
  } catch (err) {
    await completeSyncLog(logId, "failed", synced, errors + 1,
      err instanceof Error ? err.message : "Unknown error");
    errors++;
  }

  return { entity: "agreements", synced, errors, skipped: 0, duration_ms: Date.now() - start };
}

async function syncConfigurations(client: ConnectWiseClient): Promise<CWSyncResult> {
  const start = Date.now();
  const logId = await startSyncLog("hardware");
  let synced = 0;
  let errors = 0;

  try {
    const configs = await client.get<CWConfiguration>("/company/configurations");

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    for (const cw of configs) {
      const companyId = cw.company?.id;
      if (!companyId) {
        errors++;
        continue;
      }

      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("cw_company_id", companyId)
        .single();

      if (!company) {
        errors++;
        continue;
      }

      const { error } = await supabase.from("hardware_assets").upsert(
        {
          company_id: company.id,
          cw_config_id: cw.id,
          name: cw.name,
          type: cw.type?.name ?? "Overig",
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

    await completeSyncLog(logId, "completed", synced, errors);
  } catch (err) {
    await completeSyncLog(logId, "failed", synced, errors + 1,
      err instanceof Error ? err.message : "Unknown error");
    errors++;
  }

  return { entity: "hardware_assets", synced, errors, skipped: 0, duration_ms: Date.now() - start };
}

// Export mapping functions for testing
export { mapTicketStatus, mapPriority, mapAgreementStatus };
