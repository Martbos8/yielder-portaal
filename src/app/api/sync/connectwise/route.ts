import { NextRequest, NextResponse } from "next/server";
import { syncAll } from "@/lib/connectwise/sync";
import { invalidateAllCaches } from "@/lib/repositories";
import { AuthError, isAppError, toErrorResponse } from "@/lib/errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:sync");

/**
 * POST /api/sync/connectwise
 * Triggers a full ConnectWise sync. Secured with SYNC_SECRET header.
 */
export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? undefined;
  const reqLog = log.child({ requestId, route: "/api/sync/connectwise" });

  const secret = request.headers.get("x-sync-secret");
  const expectedSecret = process.env['SYNC_SECRET'];

  if (!expectedSecret || secret !== expectedSecret) {
    reqLog.warn("Sync auth failed — invalid or missing secret");
    const err = new AuthError("Ongeldige sync credentials");
    const response = toErrorResponse(err);
    return NextResponse.json({ error: response.error }, { status: response.statusCode });
  }

  const start = Date.now();
  try {
    reqLog.info("ConnectWise sync started");
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
  } catch (error) {
    const durationMs = Date.now() - start;
    reqLog.error("ConnectWise sync failed", { error, durationMs });
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.error, code: response.code },
      { status: isAppError(error) ? error.statusCode : 500 }
    );
  }
}
