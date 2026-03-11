import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/errors";
import type { SyncLog } from "@/types/database";

const SYNC_LOG_COLUMNS = "id, entity_type, status, records_synced, records_failed, error_message, started_at, completed_at, created_at" as const;

/** Fetch recent sync logs, limited to the last 10 entries. */
export async function getSyncStatus(): Promise<SyncLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sync_logs")
    .select(SYNC_LOG_COLUMNS)
    .order("started_at", { ascending: false })
    .limit(10)
    .returns<SyncLog[]>();

  if (error) throw new DatabaseError(`Failed to fetch sync status: ${error.message}`);
  return data ?? [];
}
