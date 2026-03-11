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

/** Calculate response/resolution time statistics from ticket timestamps. */
export async function getTicketStats(): Promise<TicketResponseStats> {
  return withTiming(log, "getTicketStats", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tickets")
      .select("status, is_closed, cw_created_at, cw_updated_at")
      .returns<Array<{
        status: string;
        is_closed: boolean;
        cw_created_at: string | null;
        cw_updated_at: string | null;
      }>>();

    if (error) throw new DatabaseError(`Failed to fetch ticket stats: ${error.message}`);

    const tickets = data ?? [];
    let totalOpen = 0;
    let totalClosed = 0;
    const responseTimes: number[] = [];
    const resolutionTimes: number[] = [];

    for (const t of tickets) {
      if (t.is_closed) {
        totalClosed++;
      } else {
        totalOpen++;
      }

      if (t.cw_created_at && t.cw_updated_at) {
        const created = new Date(t.cw_created_at).getTime();
        const updated = new Date(t.cw_updated_at).getTime();
        const diffHours = (updated - created) / (1000 * 60 * 60);
        if (diffHours > 0) {
          responseTimes.push(diffHours);
          if (t.is_closed) {
            resolutionTimes.push(diffHours / 24);
          }
        }
      }
    }

    const avg = (arr: number[]): number | null => {
      if (arr.length === 0) return null;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    };

    return {
      avgResponseHours: avg(responseTimes),
      totalOpen,
      totalClosed,
      avgResolutionDays: avg(resolutionTimes),
    };
  });
}
