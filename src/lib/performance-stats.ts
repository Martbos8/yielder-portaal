import type { Ticket } from "@/types/database";

export type SLAMetrics = {
  avgResponseMinutes: number;
  avgResolveMinutes: number;
  slaCompliancePercent: number;
  totalResolved: number;
  totalBreached: number;
};

export type CategoryBreakdown = {
  category: string;
  count: number;
  avgResolveMinutes: number;
};

export type MonthlyTrend = {
  month: string;
  resolved: number;
  slaCompliance: number;
  avgResponse: number;
};

export function calculateSLAMetrics(tickets: Ticket[]): SLAMetrics {
  const closedTickets = tickets.filter((t) => t.is_closed);

  if (closedTickets.length === 0) {
    return {
      avgResponseMinutes: 0,
      avgResolveMinutes: 0,
      slaCompliancePercent: 100,
      totalResolved: 0,
      totalBreached: 0,
    };
  }

  // Estimate response/resolve times from ticket dates
  let totalResponseMin = 0;
  let totalResolveMin = 0;
  let withinSLA = 0;

  for (const ticket of closedTickets) {
    const created = ticket.cw_created_at
      ? new Date(ticket.cw_created_at).getTime()
      : new Date(ticket.created_at).getTime();
    const updated = ticket.cw_updated_at
      ? new Date(ticket.cw_updated_at).getTime()
      : new Date(ticket.updated_at).getTime();

    const resolveMs = Math.max(0, updated - created);
    const resolveMin = resolveMs / (1000 * 60);

    // Estimate first response as ~20% of total resolve time
    const responseMin = resolveMin * 0.2;

    totalResponseMin += responseMin;
    totalResolveMin += resolveMin;

    // SLA target: resolve within 8 hours for normal, 4 for high, 1 for urgent
    const slaTarget = getSLATarget(ticket.priority);
    if (resolveMin <= slaTarget) {
      withinSLA++;
    }
  }

  const count = closedTickets.length;

  return {
    avgResponseMinutes: Math.round(totalResponseMin / count),
    avgResolveMinutes: Math.round(totalResolveMin / count),
    slaCompliancePercent: Math.round((withinSLA / count) * 100),
    totalResolved: count,
    totalBreached: count - withinSLA,
  };
}

function getSLATarget(priority: string): number {
  switch (priority) {
    case "urgent":
      return 60; // 1 hour
    case "high":
      return 240; // 4 hours
    case "normal":
      return 480; // 8 hours
    default:
      return 1440; // 24 hours
  }
}

export function getCategoryBreakdown(tickets: Ticket[]): CategoryBreakdown[] {
  const closedTickets = tickets.filter((t) => t.is_closed);
  const categories = new Map<
    string,
    { count: number; totalResolveMin: number }
  >();

  for (const ticket of closedTickets) {
    const category = ticket.source ?? "Overig";
    const existing = categories.get(category) ?? {
      count: 0,
      totalResolveMin: 0,
    };

    const created = ticket.cw_created_at
      ? new Date(ticket.cw_created_at).getTime()
      : new Date(ticket.created_at).getTime();
    const updated = ticket.cw_updated_at
      ? new Date(ticket.cw_updated_at).getTime()
      : new Date(ticket.updated_at).getTime();

    const resolveMin = Math.max(0, updated - created) / (1000 * 60);

    existing.count++;
    existing.totalResolveMin += resolveMin;
    categories.set(category, existing);
  }

  return Array.from(categories.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      avgResolveMinutes: Math.round(data.totalResolveMin / data.count),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getMonthlyTrends(tickets: Ticket[]): MonthlyTrend[] {
  const closedTickets = tickets.filter((t) => t.is_closed);
  const months = new Map<
    string,
    { resolved: number; withinSLA: number; totalResponseMin: number }
  >();

  // Get last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = date.toLocaleDateString("nl-NL", {
      month: "short",
      year: "numeric",
    });
    months.set(key, { resolved: 0, withinSLA: 0, totalResponseMin: 0 });
  }

  for (const ticket of closedTickets) {
    const closedDate = ticket.cw_updated_at
      ? new Date(ticket.cw_updated_at)
      : new Date(ticket.updated_at);
    const key = closedDate.toLocaleDateString("nl-NL", {
      month: "short",
      year: "numeric",
    });

    const entry = months.get(key);
    if (!entry) continue;

    entry.resolved++;

    const created = ticket.cw_created_at
      ? new Date(ticket.cw_created_at).getTime()
      : new Date(ticket.created_at).getTime();
    const updated = closedDate.getTime();
    const resolveMin = Math.max(0, updated - created) / (1000 * 60);
    const responseMin = resolveMin * 0.2;

    entry.totalResponseMin += responseMin;

    const slaTarget = getSLATarget(ticket.priority);
    if (resolveMin <= slaTarget) {
      entry.withinSLA++;
    }
  }

  return Array.from(months.entries()).map(([month, data]) => ({
    month,
    resolved: data.resolved,
    slaCompliance:
      data.resolved > 0
        ? Math.round((data.withinSLA / data.resolved) * 100)
        : 100,
    avgResponse:
      data.resolved > 0
        ? Math.round(data.totalResponseMin / data.resolved)
        : 0,
  }));
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} uur`;
  return `${hours}u ${mins}m`;
}
