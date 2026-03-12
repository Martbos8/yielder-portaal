import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/errors";
import { createLogger, withTiming } from "@/lib/logger";
import type { Ticket } from "@/types/database";

const log = createLogger("repo:tickets");

const TICKET_COLUMNS = "id, company_id, cw_ticket_id, summary, description, status, priority, contact_name, source, is_closed, cw_created_at, cw_updated_at, created_at, updated_at" as const;

/** Lighter columns for list views (no description). */
const TICKET_LIST_COLUMNS = "id, company_id, cw_ticket_id, summary, status, priority, contact_name, source, is_closed, cw_created_at, cw_updated_at, created_at, updated_at" as const;

/** Cursor-based pagination result. */
export interface PaginatedResult<T> {
  data: T[];
  /** Cursor for the next page (null when no more results). */
  nextCursor: string | null;
  /** Total count (only available on first page if requested). */
  totalCount?: number;
}

/** Fetch all tickets, ordered by creation date (newest first). */
export async function getTickets(): Promise<Ticket[]> {
  return withTiming(log, "getTickets", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tickets")
      .select(TICKET_LIST_COLUMNS)
      .order("cw_created_at", { ascending: false })
      .returns<Ticket[]>();

    if (error) throw new DatabaseError(`Failed to fetch tickets: ${error.message}`);
    return data ?? [];
  });
}

/**
 * Fetch tickets with cursor-based pagination.
 * Uses (cw_created_at, id) as composite cursor for stable ordering.
 * More efficient than offset-based pagination for large datasets.
 */
export async function getTicketsPaginated(options: {
  limit?: number;
  cursor?: string;
  includeCount?: boolean;
}): Promise<PaginatedResult<Ticket>> {
  const { limit = 25, cursor, includeCount = false } = options;

  return withTiming(log, "getTicketsPaginated", async () => {
    const supabase = await createClient();

    // Fetch one extra row to determine if there's a next page
    const fetchLimit = limit + 1;

    let query = supabase
      .from("tickets")
      .select(
        TICKET_LIST_COLUMNS,
        includeCount && !cursor ? { count: "exact" } : undefined,
      )
      .order("cw_created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(fetchLimit);

    // Apply cursor filter: fetch rows older than the cursor position
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        // Composite cursor: (cw_created_at < cursorDate) OR (cw_created_at = cursorDate AND id < cursorId)
        query = query.or(
          `cw_created_at.lt.${decoded.date},and(cw_created_at.eq.${decoded.date},id.lt.${decoded.id})`,
        );
      }
    }

    const result = await query.returns<Ticket[]>();

    if (result.error) throw new DatabaseError(`Failed to fetch tickets: ${result.error.message}`);

    const rows = result.data ?? [];
    const hasMore = rows.length > limit;
    const pageData = hasMore ? rows.slice(0, limit) : rows;

    // Build cursor from the last item in this page
    const lastItem = pageData[pageData.length - 1];
    const nextCursor = hasMore && lastItem
      ? encodeCursor(lastItem.cw_created_at ?? lastItem.created_at, lastItem.id)
      : null;

    return {
      data: pageData,
      nextCursor,
      ...(includeCount && !cursor && result.count != null
        ? { totalCount: result.count }
        : {}),
    };
  }, { limit: String(limit), hasCursor: String(!!cursor) });
}

/** Encode a (date, id) pair into an opaque cursor string. */
function encodeCursor(date: string | null, id: string): string {
  return Buffer.from(JSON.stringify({ d: date, i: id })).toString("base64url");
}

/** Decode a cursor string back to (date, id). Returns null for invalid cursors. */
function decodeCursor(cursor: string): { date: string; id: string } | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf-8"),
    );
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "d" in parsed &&
      "i" in parsed &&
      typeof (parsed as Record<string, unknown>)["d"] === "string" &&
      typeof (parsed as Record<string, unknown>)["i"] === "string"
    ) {
      return {
        date: (parsed as Record<string, unknown>)["d"] as string,
        id: (parsed as Record<string, unknown>)["i"] as string,
      };
    }
    return null;
  } catch {
    return null;
  }
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

/**
 * Calculate response/resolution time statistics.
 * Optimized: single query fetching minimal columns (is_closed + timestamps)
 * instead of 3 separate queries. Client-side counts + averages.
 */
export async function getTicketStats(): Promise<TicketResponseStats> {
  return withTiming(log, "getTicketStats", async () => {
    const supabase = await createClient();

    // Single query: fetch is_closed flag + timestamps for all tickets
    // This replaces 3 parallel queries with 1 query fetching only 3 columns
    const { data, error } = await supabase
      .from("tickets")
      .select("is_closed, cw_created_at, cw_updated_at")
      .returns<Array<{
        is_closed: boolean;
        cw_created_at: string | null;
        cw_updated_at: string | null;
      }>>();

    if (error) throw new DatabaseError(`Failed to fetch ticket stats: ${error.message}`);

    let totalOpen = 0;
    let totalClosed = 0;
    let responseSum = 0;
    let responseCount = 0;
    let resolutionSum = 0;
    let resolutionCount = 0;

    for (const t of data ?? []) {
      // Count open/closed
      if (t.is_closed) {
        totalClosed++;
      } else {
        totalOpen++;
      }

      // Calculate timing averages (only for rows with both timestamps)
      if (t.cw_created_at && t.cw_updated_at) {
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
    }

    return {
      avgResponseHours: responseCount > 0 ? responseSum / responseCount : null,
      totalOpen,
      totalClosed,
      avgResolutionDays: resolutionCount > 0 ? resolutionSum / resolutionCount : null,
    };
  });
}
