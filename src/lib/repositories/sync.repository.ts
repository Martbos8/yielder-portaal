import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/errors";
import { createLogger, withTiming } from "@/lib/logger";
import type { SyncLog } from "@/types/database";

const log = createLogger("repo:sync");

const SYNC_LOG_COLUMNS = "id, entity_type, status, records_synced, records_failed, error_message, started_at, completed_at, created_at" as const;

/** Fetch recent sync logs, limited to the last 10 entries. */
export async function getSyncStatus(): Promise<SyncLog[]> {
  return withTiming(log, "getSyncStatus", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sync_logs")
      .select(SYNC_LOG_COLUMNS)
      .order("started_at", { ascending: false })
      .limit(10)
      .returns<SyncLog[]>();

    if (error) throw new DatabaseError(`Failed to fetch sync status: ${error.message}`);
    return data ?? [];
  });
}
