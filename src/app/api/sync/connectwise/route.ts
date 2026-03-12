import { NextResponse } from "next/server";
import { syncAll } from "@/lib/connectwise/sync";
import { invalidateAllCaches } from "@/lib/repositories";
import { createApiHandler } from "@/lib/api/middleware";

/**
 * POST /api/sync/connectwise
 * Triggers a full ConnectWise sync. Secured with SYNC_SECRET header.
 */
export const POST = createApiHandler({
  secretAuth: {
    headerName: "x-sync-secret",
    envVar: "SYNC_SECRET",
  },
  rateLimit: { maxRequests: 10, windowMs: 60 * 1000 },
  audit: "connectwise_sync",
  handler: async (_req, { log: reqLog }) => {
    reqLog.info("ConnectWise sync started");
    const start = Date.now();

    const results = await syncAll();

    if (results.length === 0) {
      reqLog.info("Sync skipped — demo mode (no API keys)");
      return NextResponse.json({
        message: "Demo modus — geen CW API keys geconfigureerd",
        results: [],
      });
    }

    // Invalidate all caches after successful sync — data has changed
    invalidateAllCaches();

    const durationMs = Date.now() - start;
    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
    reqLog.info("ConnectWise sync completed", { durationMs, totalSynced, totalErrors });

    return NextResponse.json({ message: "Sync voltooid", results });
  },
});
