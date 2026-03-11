import { NextRequest, NextResponse } from "next/server";
import { syncAll } from "@/lib/connectwise/sync";
import { logAudit } from "@/lib/audit";

/**
 * Verify sync request authentication.
 * Supports:
 * 1. Vercel Cron: `authorization: Bearer ${CRON_SECRET}`
 * 2. Manual/custom: `x-sync-secret: ${SYNC_SECRET}`
 */
function isAuthorized(request: NextRequest): boolean {
  // Check Vercel CRON_SECRET via Authorization header
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${cronSecret}`) {
      return true;
    }
  }

  // Check custom SYNC_SECRET header
  const syncSecret = process.env.SYNC_SECRET;
  if (syncSecret) {
    const headerSecret = request.headers.get("x-sync-secret");
    if (headerSecret === syncSecret) {
      return true;
    }
  }

  return false;
}

async function handleSync(request: NextRequest) {
  if (!isAuthorized(request)) {
    await logAudit(null, "sync_attempt_unauthorized", "sync", null, {
      method: request.method,
      ip: request.headers.get("x-forwarded-for") ?? "unknown",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await logAudit(null, "sync_started", "sync", null, {
    method: request.method,
    trigger: request.headers.get("authorization")?.startsWith("Bearer ")
      ? "vercel_cron"
      : "manual",
  });

  try {
    const results = await syncAll();

    if (results.length === 0) {
      await logAudit(null, "sync_completed", "sync", null, {
        mode: "demo",
        results: [],
      });
      return NextResponse.json({
        message: "Demo modus — geen CW API keys geconfigureerd",
        results: [],
      });
    }

    await logAudit(null, "sync_completed", "sync", null, {
      results: results.map((r) => ({
        entity: r.entity,
        synced: r.synced,
        errors: r.errors,
        duration_ms: r.duration_ms,
      })),
    });

    return NextResponse.json({ message: "Sync voltooid", results });
  } catch {
    await logAudit(null, "sync_failed", "sync", null, {
      error: "Sync mislukt",
    });
    return NextResponse.json(
      { error: "Sync mislukt" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/connectwise
 * Used by Vercel Cron jobs.
 */
export async function GET(request: NextRequest) {
  return handleSync(request);
}

/**
 * POST /api/sync/connectwise
 * Used for manual sync triggers.
 */
export async function POST(request: NextRequest) {
  return handleSync(request);
}
