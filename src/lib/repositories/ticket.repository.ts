import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/errors";
import { createLogger, withTiming } from "@/lib/logger";
import type { Ticket } from "@/types/database";

const log = createLogger("repo:tickets");

const TICKET_COLUMNS = "id, company_id, cw_ticket_id, summary, description, status, priority, contact_name, source, is_closed, cw_created_at, cw_updated_at, created_at, updated_at" as const;

/** Fetch all tickets, ordered by creation date (newest first). */
export async function getTickets(): Promise<Ticket[]> {
  return withTiming(log, "getTickets", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tickets")
      .select(TICKET_COLUMNS)
      .order("cw_created_at", { ascending: false })
      .returns<Ticket[]>();

    if (error) throw new DatabaseError(`Failed to fetch tickets: ${error.message}`);
    return data ?? [];
  });
}

/** Fetch a single ticket by id. Returns null if not found. */
export async function getTicketById(id: string): Promise<Ticket | null> {
  return withTiming(log, "getTicketById", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tickets")
      .select(TICKET_COLUMNS)
      .eq("id", id)
      .returns<Ticket[]>()
      .single();

    if (error && error.code !== "PGRST116") {
      throw new DatabaseError(`Failed to fetch ticket ${id}: ${error.message}`);
    }
    return data;
  }, { ticketId: id });
}

/** Fetch recent open tickets, limited to `limit` results. */
export async function getRecentTickets(limit = 5): Promise<Ticket[]> {
  return withTiming(log, "getRecentTickets", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tickets")
      .select(TICKET_COLUMNS)
      .eq("is_closed", false)
      .order("cw_created_at", { ascending: false })
      .limit(limit)
      .returns<Ticket[]>();

    if (error) throw new DatabaseError(`Failed to fetch recent tickets: ${error.message}`);
    return data ?? [];
  }, { limit: String(limit) });
}

/** Count open (not closed) tickets. */
export async function getOpenTicketCount(): Promise<number> {
  return withTiming(log, "getOpenTicketCount", async () => {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("is_closed", false);

    if (error) throw new DatabaseError(`Failed to count open tickets: ${error.message}`);
    return count ?? 0;
  });
}

/** Fetch similar tickets (same source, excluding the given ticket). */
export async function getSimilarTickets(
  ticketId: string,
  companyId: string,
  source: string | null,
  limit = 5
): Promise<Ticket[]> {
  return withTiming(log, "getSimilarTickets", async () => {
    const supabase = await createClient();
    let query = supabase
      .from("tickets")
      .select(TICKET_COLUMNS)
      .eq("company_id", companyId)
      .neq("id", ticketId);

    if (source) {
      query = query.eq("source", source);
    }

    const { data, error } = await query
      .order("cw_created_at", { ascending: false })
      .limit(limit)
      .returns<Ticket[]>();

    if (error) throw new DatabaseError(`Failed to fetch similar tickets: ${error.message}`);
    return data ?? [];
  }, { ticketId });
}

/** Response time stats for tickets. */
export interface TicketResponseStats {
  avgResponseHours: number | null;
  totalOpen: number;
  totalClosed: number;
  avgResolutionDays: number | null;
}

/** Calculate response/resolution time statistics using efficient count queries. */
export async function getTicketStats(): Promise<TicketResponseStats> {
  return withTiming(log, "getTicketStats", async () => {
    const supabase = await createClient();

    const [openRes, closedRes, timingsRes] = await Promise.all([
      // Count open tickets
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("is_closed", false),
      // Count closed tickets
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("is_closed", true),
      // Fetch only timestamps for avg calculation (only tickets with both dates)
      supabase
        .from("tickets")
        .select("is_closed, cw_created_at, cw_updated_at")
        .not("cw_created_at", "is", null)
        .not("cw_updated_at", "is", null)
        .returns<Array<{
          is_closed: boolean;
          cw_created_at: string;
          cw_updated_at: string;
        }>>(),
    ]);

    if (openRes.error) throw new DatabaseError(`Failed to count open tickets: ${openRes.error.message}`);
    if (closedRes.error) throw new DatabaseError(`Failed to count closed tickets: ${closedRes.error.message}`);
    if (timingsRes.error) throw new DatabaseError(`Failed to fetch ticket timings: ${timingsRes.error.message}`);

    // Calculate averages from the filtered set (only rows with valid timestamps)
    let responseSum = 0;
    let responseCount = 0;
    let resolutionSum = 0;
    let resolutionCount = 0;

    for (const t of timingsRes.data ?? []) {
      const diffHours = (new Date(t.cw_updated_at).getTime() - new Date(t.cw_created_at).getTime()) / (1000 * 60 * 60);
      if (diffHours > 0) {
        responseSum += diffHours;
        responseCount++;
        if (t.is_closed) {
          resolutionSum += diffHours / 24;
          resolutionCount++;
        }
      }
    }

    return {
      avgResponseHours: responseCount > 0 ? responseSum / responseCount : null,
      totalOpen: openRes.count ?? 0,
      totalClosed: closedRes.count ?? 0,
      avgResolutionDays: resolutionCount > 0 ? resolutionSum / resolutionCount : null,
    };
  });
}
