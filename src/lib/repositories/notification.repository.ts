import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/errors";
import { createLogger, withTiming } from "@/lib/logger";
import type { Notification } from "@/types/database";

const log = createLogger("repo:notifications");

const NOTIFICATION_COLUMNS = "id, company_id, user_id, title, message, type, is_read, link, created_at" as const;

/** Fetch notifications, optionally filtered to unread only. */
export async function getNotifications(unreadOnly = false): Promise<Notification[]> {
  return withTiming(log, "getNotifications", async () => {
    const supabase = await createClient();
    let query = supabase
      .from("notifications")
      .select(NOTIFICATION_COLUMNS)
      .order("created_at", { ascending: false });

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query.returns<Notification[]>();
    if (error) throw new DatabaseError(`Failed to fetch notifications: ${error.message}`);
    return data ?? [];
  }, { unreadOnly: String(unreadOnly) });
}

/** Count unread notifications efficiently (no data transfer). */
export async function getUnreadNotificationCount(): Promise<number> {
  return withTiming(log, "getUnreadNotificationCount", async () => {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    if (error) throw new DatabaseError(`Failed to count unread notifications: ${error.message}`);
    return count ?? 0;
  });
}
