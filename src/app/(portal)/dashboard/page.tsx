/** Revalidate dashboard data every 2 minutes (matches CacheTTL.SHORT). */
export const revalidate = 120;

import Link from "next/link";
import {
  getCachedDashboardStats,
  getCachedRecommendations,
  getCachedUserCompanyId,
  getRecentTickets,
  getExpiringAgreements,
  getExpiredWarrantyHardware,
} from "@/lib/repositories";
import type { Recommendation } from "@/lib/engine/recommendation";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  StatCard,
  StatusBadge,
  SeverityDot,
  EmptyStateInline,
  ticketStatusConfig,
  severityConfig,
} from "@/components/data-display";

async function getTopRecommendations(): Promise<Recommendation[]> {
  try {
    const companyId = await getCachedUserCompanyId();
    if (!companyId) return [];
    const all = await getCachedRecommendations(companyId);
    const sorted = [...all].sort((a, b) => {
      if (a.severity === "critical" && b.severity !== "critical") return -1;
      if (a.severity !== "critical" && b.severity === "critical") return 1;
      return b.score - a.score;
    });
    return sorted.slice(0, 3);
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const [stats, recentTickets, expiringAgreements, expiredWarranty, topRecommendations] =
    await Promise.all([
      getCachedDashboardStats(),
      getRecentTickets(5),
      getExpiringAgreements(30),
      getExpiredWarrantyHardware(),
      getTopRecommendations(),
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
          <StatCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} />
        ))}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aanbevelingen voor u */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Aanbevelingen voor u
            </h2>
            <Link
              href="/upgrade"
              className="text-xs text-yielder-navy hover:text-yielder-orange transition-colors font-medium"
            >
              Bekijk alle aanbevelingen →
            </Link>
          </div>

          {topRecommendations.length === 0 ? (
            <EmptyStateInline icon="check_circle" message="Alles up-to-date" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topRecommendations.map((rec) => {
                const sevStyle = severityConfig[rec.severity ?? "info"];
                return (
                  <Link
                    key={rec.product.id}
                    href="/upgrade"
                    className="flex flex-col gap-2 p-4 rounded-xl border border-border hover:shadow-card-hover hover:border-yielder-navy/20 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <SeverityDot severity={rec.severity} />
                      <span className="text-xs font-medium text-muted-foreground">
                        {rec.category}
                      </span>
                      <Badge className={`ml-auto text-[10px] px-1.5 py-0 ${sevStyle?.className ?? ""}`}>
                        {sevStyle?.label ?? "Suggestie"}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {rec.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {rec.reason}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

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
            <EmptyStateInline icon="check_circle" message="Geen open tickets" />
          ) : (
            <ul className="space-y-3">
              {recentTickets.map((ticket) => (
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
                  <StatusBadge
                    status={ticket.status}
                    config={ticketStatusConfig}
                    className="shrink-0"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Aandachtspunten */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Aandachtspunten
          </h2>

          {expiringAgreements.length === 0 && expiredWarranty.length === 0 ? (
            <EmptyStateInline icon="check_circle" message="Geen aandachtspunten" />
          ) : (
            <div className="space-y-5">
              {expiringAgreements.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Contracten verlopen binnenkort
                  </h3>
                  <ul className="space-y-2">
                    {expiringAgreements.map((agreement) => (
                      <li
                        key={agreement.id}
                        className="flex items-center justify-between gap-3 py-1.5 border-b border-border last:border-0"
                      >
                        <span className="text-sm font-medium text-foreground truncate">
                          {agreement.name}
                        </span>
                        <Badge className="shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          Verloopt {formatDate(agreement.end_date)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {expiredWarranty.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Verlopen garantie
                  </h3>
                  <ul className="space-y-2">
                    {expiredWarranty.map((asset) => (
                      <li
                        key={asset.id}
                        className="flex items-center justify-between gap-3 py-1.5 border-b border-border last:border-0"
                      >
                        <span className="text-sm font-medium text-foreground truncate">
                          {asset.name}
                        </span>
                        <Badge className="shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Verlopen {formatDate(asset.warranty_expiry)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
