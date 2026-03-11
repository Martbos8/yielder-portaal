import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/errors";
import type { Ticket } from "@/types/database";

const TICKET_COLUMNS = "id, company_id, cw_ticket_id, summary, description, status, priority, contact_name, source, is_closed, cw_created_at, cw_updated_at, created_at, updated_at" as const;

/** Fetch all tickets, ordered by creation date (newest first). */
export async function getTickets(): Promise<Ticket[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(TICKET_COLUMNS)
    .order("cw_created_at", { ascending: false })
    .returns<Ticket[]>();

  if (error) throw new DatabaseError(`Failed to fetch tickets: ${error.message}`);
  return data ?? [];
}

/** Fetch a single ticket by id. Returns null if not found. */
export async function getTicketById(id: string): Promise<Ticket | null> {
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
}

/** Fetch recent open tickets, limited to `limit` results. */
export async function getRecentTickets(limit = 5): Promise<Ticket[]> {
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
}

/** Count open (not closed) tickets. */
export async function getOpenTicketCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("is_closed", false);

  if (error) throw new DatabaseError(`Failed to count open tickets: ${error.message}`);
  return count ?? 0;
}
