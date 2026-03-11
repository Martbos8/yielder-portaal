import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/errors";
import { createLogger, withTiming } from "@/lib/logger";

const log = createLogger("repo:dashboard");

/** Trend data: current vs previous period comparison. */
export interface DashboardTrends {
  /** Percentage change in open tickets (positive = more tickets). */
  ticketTrend: number;
  /** Percentage change in hardware count. */
  hardwareTrend: number;
  /** Percentage change in active contracts. */
  contractTrend: number;
  /** Percentage change in monthly amount. */
  amountTrend: number;
  /** Daily ticket counts for last 14 days (sparkline data). */
  ticketSparkline: number[];
}

/** Recent activity entry from the audit log. */
export interface ActivityEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

/**
 * Calculate dashboard trends by comparing current 30-day window with previous 30-day window.
 * Also provides sparkline data for ticket creation over the last 14 days.
 */
export async function getDashboardTrends(): Promise<DashboardTrends> {
  return withTiming(log, "getDashboardTrends", async () => {
    const supabase = await createClient();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const [ticketsRes, hardwareRes, agreementsRes] = await Promise.all([
      // All tickets from last 60 days with creation date
      supabase
        .from("tickets")
        .select("cw_created_at, is_closed")
        .gte("cw_created_at", sixtyDaysAgo.toISOString()),
      // All hardware from last 60 days
      supabase
        .from("hardware_assets")
        .select("created_at")
        .gte("created_at", sixtyDaysAgo.toISOString()),
      // Agreements with status changes
      supabase
        .from("agreements")
        .select("status, bill_amount, created_at")
        .gte("created_at", sixtyDaysAgo.toISOString()),
    ]);

    if (ticketsRes.error) throw new DatabaseError(`Failed to fetch ticket trends: ${ticketsRes.error.message}`);
    if (hardwareRes.error) throw new DatabaseError(`Failed to fetch hardware trends: ${hardwareRes.error.message}`);
    if (agreementsRes.error) throw new DatabaseError(`Failed to fetch agreement trends: ${agreementsRes.error.message}`);

    const tickets = ticketsRes.data ?? [];
    const hardware = hardwareRes.data ?? [];
    const agreements = agreementsRes.data ?? [];

    // Calculate ticket trend: tickets created this period vs previous period
    const recentTickets = tickets.filter((t) => new Date(t.cw_created_at ?? "").getTime() >= thirtyDaysAgo.getTime());
    const previousTickets = tickets.filter((t) => {
      const d = new Date(t.cw_created_at ?? "").getTime();
      return d >= sixtyDaysAgo.getTime() && d < thirtyDaysAgo.getTime();
    });

    // Hardware trend
    const recentHardware = hardware.filter((h) => new Date(h.created_at).getTime() >= thirtyDaysAgo.getTime());
    const previousHardware = hardware.filter((h) => {
      const d = new Date(h.created_at).getTime();
      return d >= sixtyDaysAgo.getTime() && d < thirtyDaysAgo.getTime();
    });

    // Agreement trend (active agreements added)
    const recentAgreements = agreements.filter(
      (a) => a.status === "active" && new Date(a.created_at).getTime() >= thirtyDaysAgo.getTime()
    );
    const previousAgreements = agreements.filter(
      (a) => a.status === "active" && new Date(a.created_at).getTime() >= sixtyDaysAgo.getTime() && new Date(a.created_at).getTime() < thirtyDaysAgo.getTime()
    );

    // Amount trend
    const recentAmount = recentAgreements.reduce((sum, a) => sum + (a.bill_amount ?? 0), 0);
    const previousAmount = previousAgreements.reduce((sum, a) => sum + (a.bill_amount ?? 0), 0);

    // Sparkline: daily ticket counts for last 14 days
    const ticketSparkline: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const count = tickets.filter((t) => {
        const d = new Date(t.cw_created_at ?? "").getTime();
        return d >= dayStart.getTime() && d < dayEnd.getTime();
      }).length;
      ticketSparkline.push(count);
    }

    return {
      ticketTrend: calcTrend(recentTickets.length, previousTickets.length),
      hardwareTrend: calcTrend(recentHardware.length, previousHardware.length),
      contractTrend: calcTrend(recentAgreements.length, previousAgreements.length),
      amountTrend: calcTrend(recentAmount, previousAmount),
      ticketSparkline,
    };
  });
}

/** Calculate percentage change; returns 0 when previous is 0. */
function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/** Fetch recent activity entries from the audit log. */
export async function getRecentActivity(limit = 10): Promise<ActivityEntry[]> {
  return withTiming(log, "getRecentActivity", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select("id, action, entity_type, entity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new DatabaseError(`Failed to fetch recent activity: ${error.message}`);

    return (data ?? []).map((entry) => ({
      id: entry.id,
      action: entry.action,
      entityType: entry.entity_type,
      entityId: entry.entity_id,
      createdAt: entry.created_at,
    }));
  });
}
