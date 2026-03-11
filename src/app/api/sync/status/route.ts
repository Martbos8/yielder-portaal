import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { SyncLog } from "@/types/database";

/**
 * GET /api/sync/status
 * Returns the latest sync log per entity type and overall last sync time.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const rateResult = checkRateLimit(`sync-status:${user.id}`, RATE_LIMITS.apiCall);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Te veel verzoeken" },
      { status: 429 }
    );
  }

  const { data, error } = await supabase
    .from("sync_logs")
    .select("id, entity_type, status, records_synced, records_failed, error_message, started_at, completed_at, created_at")
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Sync status ophalen mislukt" },
      { status: 500 }
    );
  }

  const logs = (data ?? []) as SyncLog[];

  // Get latest log per entity_type
  const latestByEntity = new Map<string, SyncLog>();
  for (const log of logs) {
    if (!latestByEntity.has(log.entity_type)) {
      latestByEntity.set(log.entity_type, log);
    }
  }

  const latestLogs = Array.from(latestByEntity.values());

  // Overall last completed sync
  const lastCompleted = logs.find((l) => l.status === "completed");
  const lastSync = lastCompleted?.completed_at ?? null;

  return NextResponse.json({ logs: latestLogs, lastSync });
}
