import { NextResponse } from "next/server";
import { syncAll } from "@/lib/connectwise/sync";
import { invalidateAllCaches } from "@/lib/repositories";
import { createApiHandler } from "@/lib/api/middleware";

/**
 * POST /api/sync/connectwise
 * Triggers a full ConnectWise sync. Secured with SYNC_SECRET header.
 * Supports idempotent sync via optional sync_id in body.
 */
export const POST = createApiHandler({
  secretAuth: {
    headerName: "x-sync-secret",
    envVar: "SYNC_SECRET",
  },
  rateLimit: { maxRequests: 10, windowMs: 60 * 1000 },
  audit: "connectwise_sync",
  handler: async (req, { log: reqLog }) => {
    // Optional sync_id for idempotency
    let syncId: string | undefined;
    try {
      const body = await req.clone().json() as Record<string, unknown>;
      if (typeof body["sync_id"] === "string") {
        syncId = body["sync_id"];
      }
    } catch {
      // No body or invalid JSON — proceed without sync_id
    }

    reqLog.info("ConnectWise sync started", { syncId });
    const meta = await syncAll(syncId);

    if (meta.entity_results.length === 0 && meta.total_synced === 0) {
      reqLog.info("Sync skipped — demo mode or already completed", { syncId: meta.sync_id });
      return NextResponse.json({
        message: "Sync overgeslagen — niet geconfigureerd of al voltooid",
        sync_id: meta.sync_id,
        results: [],
      });
    }

    // Invalidate all caches after successful sync — data has changed
    invalidateAllCaches();

    reqLog.info("ConnectWise sync completed", {
      syncId: meta.sync_id,
      totalDurationMs: meta.total_duration_ms,
      totalSynced: meta.total_synced,
      totalErrors: meta.total_errors,
      retryQueueSize: meta.retry_queue.length,
    });

    return NextResponse.json({
      message: "Sync voltooid",
      sync_id: meta.sync_id,
      total_duration_ms: meta.total_duration_ms,
      total_synced: meta.total_synced,
      total_errors: meta.total_errors,
      results: meta.entity_results,
      retry_queue: meta.retry_queue,
    });
  },
});
