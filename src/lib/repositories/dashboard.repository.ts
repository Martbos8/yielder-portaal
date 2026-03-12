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
 * Calculate dashboard trends using targeted count queries per period.
 * Uses 6 parallel count/sum queries instead of loading all rows into memory.
 */
export async function getDashboardTrends(): Promise<DashboardTrends> {
  return withTiming(log, "getDashboardTrends", async () => {
    const supabase = await createClient();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      recentTicketsRes,
      prevTicketsRes,
      recentHardwareRes,
      prevHardwareRes,
      recentAgreementsRes,
      prevAgreementsRes,
      sparklineRes,
    ] = await Promise.all([
      // Current 30-day ticket count
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .gte("cw_created_at", thirtyDaysAgo.toISOString()),
      // Previous 30-day ticket count
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .gte("cw_created_at", sixtyDaysAgo.toISOString())
        .lt("cw_created_at", thirtyDaysAgo.toISOString()),
      // Current 30-day hardware count
      supabase
        .from("hardware_assets")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString()),
      // Previous 30-day hardware count
      supabase
        .from("hardware_assets")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sixtyDaysAgo.toISOString())
        .lt("created_at", thirtyDaysAgo.toISOString()),
      // Current 30-day active agreements (with bill_amount for sum)
      supabase
        .from("agreements")
        .select("bill_amount")
        .eq("status", "active")
        .gte("created_at", thirtyDaysAgo.toISOString()),
      // Previous 30-day active agreements (with bill_amount for sum)
      supabase
        .from("agreements")
        .select("bill_amount")
        .eq("status", "active")
        .gte("created_at", sixtyDaysAgo.toISOString())
        .lt("created_at", thirtyDaysAgo.toISOString()),
      // Sparkline: last 14 days of tickets with their creation dates
      supabase
        .from("tickets")
        .select("cw_created_at")
        .gte("cw_created_at", fourteenDaysAgo.toISOString())
        .order("cw_created_at", { ascending: true }),
    ]);

    // Check for errors
    if (recentTicketsRes.error) throw new DatabaseError(`Failed to fetch ticket trends: ${recentTicketsRes.error.message}`);
    if (prevTicketsRes.error) throw new DatabaseError(`Failed to fetch ticket trends: ${prevTicketsRes.error.message}`);
    if (recentHardwareRes.error) throw new DatabaseError(`Failed to fetch hardware trends: ${recentHardwareRes.error.message}`);
    if (prevHardwareRes.error) throw new DatabaseError(`Failed to fetch hardware trends: ${prevHardwareRes.error.message}`);
    if (recentAgreementsRes.error) throw new DatabaseError(`Failed to fetch agreement trends: ${recentAgreementsRes.error.message}`);
    if (prevAgreementsRes.error) throw new DatabaseError(`Failed to fetch agreement trends: ${prevAgreementsRes.error.message}`);
    if (sparklineRes.error) throw new DatabaseError(`Failed to fetch sparkline data: ${sparklineRes.error.message}`);

    // Agreement amounts
    const recentAmount = (recentAgreementsRes.data ?? []).reduce(
      (sum, a) => sum + (a.bill_amount ?? 0), 0
    );
    const prevAmount = (prevAgreementsRes.data ?? []).reduce(
      (sum, a) => sum + (a.bill_amount ?? 0), 0
    );

    // Build sparkline: bucket tickets into 14 daily bins
    const ticketSparkline = buildSparkline(sparklineRes.data ?? [], now);

    return {
      ticketTrend: calcTrend(recentTicketsRes.count ?? 0, prevTicketsRes.count ?? 0),
      hardwareTrend: calcTrend(recentHardwareRes.count ?? 0, prevHardwareRes.count ?? 0),
      contractTrend: calcTrend(
        (recentAgreementsRes.data ?? []).length,
        (prevAgreementsRes.data ?? []).length
      ),
      amountTrend: calcTrend(recentAmount, prevAmount),
      ticketSparkline,
    };
  });
}

/** Build 14-day sparkline from pre-sorted ticket dates. */
function buildSparkline(
  tickets: Array<{ cw_created_at: string | null }>,
  now: Date
): number[] {
  const sparkline: number[] = new Array(14).fill(0) as number[];

  for (const t of tickets) {
    if (!t.cw_created_at) continue;
    const ticketDate = new Date(t.cw_created_at);
    // Days ago (0 = today, 13 = 13 days ago)
    const daysAgo = Math.floor((now.getTime() - ticketDate.getTime()) / (24 * 60 * 60 * 1000));
    // Map to sparkline index (0 = oldest = 13 days ago, 13 = newest = today)
    const idx = 13 - daysAgo;
    if (idx >= 0 && idx < 14) {
      sparkline[idx]!++;
    }
  }

  return sparkline;
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
