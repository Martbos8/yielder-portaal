import Link from "next/link";
import { getDashboardStats, getRecentTickets } from "@/lib/queries";
import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import type { TicketStatus } from "@/types/database";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusConfig: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  in_progress: {
    label: "In behandeling",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  closed: {
    label: "Gesloten",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

export default async function DashboardPage() {
  const [stats, recentTickets] = await Promise.all([
    getDashboardStats(),
    getRecentTickets(5),
  ]);

  const kpis = [
    {
      label: "Open tickets",
      value: String(stats.openTickets),
      icon: "confirmation_number",
    },
    {
      label: "Hardware",
      value: String(stats.hardwareCount),
      icon: "laptop_mac",
    },
    {
      label: "Contracten",
      value: String(stats.activeContracts),
      icon: "verified_user",
    },
    {
      label: "Maandbedrag",
      value: formatCurrency(stats.monthlyAmount),
      icon: "payments",
    },
  ];

  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Dashboard</h1>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card rounded-2xl p-5 shadow-card border border-border
              hover:shadow-card-hover hover:scale-[1.015] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </span>
              <MaterialIcon
                name={kpi.icon}
                className="text-yielder-navy/70"
                size={20}
              />
            </div>
            <span className="text-3xl font-bold text-foreground">
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recente tickets */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Recente tickets
            </h2>
            <Link
              href="/tickets"
              className="text-xs text-yielder-navy hover:text-yielder-orange transition-colors font-medium"
            >
              Bekijk alle tickets →
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MaterialIcon
                name="check_circle"
                className="text-emerald-500 mb-2"
                size={32}
              />
              <p className="text-sm">Geen open tickets</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentTickets.map((ticket) => {
                const status = statusConfig[ticket.status];
                return (
                  <li
                    key={ticket.id}
                    className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {ticket.summary}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(ticket.cw_created_at)}
                      </p>
                    </div>
                    <Badge
                      className={`shrink-0 ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Aandachtspunten placeholder */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Aandachtspunten
          </h2>
          <p className="text-sm text-muted-foreground">
            Wordt gevuld met live data.
          </p>
        </div>
      </div>
    </div>
  );
}
