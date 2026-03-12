// Scheduled ConnectWise sync job
// Idempotent: uses date-based sync_id to prevent duplicate runs within the same hour

import { createLogger } from "@/lib/logger";
import { ExternalServiceError } from "@/lib/errors";
import type { JobResult } from "./types";

const log = createLogger("job:sync-scheduler");

/**
 * Generates a deterministic sync ID based on current hour.
 * Prevents duplicate syncs within the same hour window.
 */
function generateSyncId(): string {
  const now = new Date();
  const hourKey = now.toISOString().slice(0, 13); // "2026-03-12T14"
  return `cron-${hourKey}`;
}

/**
 * Runs a scheduled ConnectWise sync.
 * Safe to call multiple times — idempotent via hourly sync_id.
 */
export async function runSyncScheduler(): Promise<JobResult> {
  const start = Date.now();
  const syncId = generateSyncId();

  log.info("Sync scheduler started", { syncId });

  try {
    const { syncAll } = await import("@/lib/connectwise/sync");
    const meta = await syncAll(syncId);

    const duration_ms = Date.now() - start;

    if (meta.entity_results.length === 0 && meta.total_synced === 0) {
      log.info("Sync scheduler completed — skipped (not configured or already done)", {
        syncId,
        durationMs: duration_ms,
      });

      return {
        job: "sync-connectwise",
        success: true,
        duration_ms,
        details: {
          syncId: meta.sync_id,
          skipped: true,
          reason: "not_configured_or_already_completed",
        },
      };
    }

    // Invalidate caches after successful sync
    const { invalidateAllCaches } = await import("@/lib/repositories/cached");
    invalidateAllCaches();

    log.info("Sync scheduler completed", {
      syncId: meta.sync_id,
      totalSynced: meta.total_synced,
      totalErrors: meta.total_errors,
      retryQueueSize: meta.retry_queue.length,
      durationMs: duration_ms,
    });

    return {
      job: "sync-connectwise",
      success: meta.total_errors === 0,
      duration_ms,
      details: {
        syncId: meta.sync_id,
        totalSynced: meta.total_synced,
        totalErrors: meta.total_errors,
        retryQueueSize: meta.retry_queue.length,
        entities: meta.entity_results.map((r) => ({
          entity: r.entity,
          synced: r.synced,
          errors: r.errors,
        })),
      },
    };
  } catch (error) {
    const duration_ms = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);

    log.error("Sync scheduler failed", { error, syncId, durationMs: duration_ms });

    throw new ExternalServiceError("ConnectWise", `Scheduled sync failed: ${message}`, error);
  }
}
