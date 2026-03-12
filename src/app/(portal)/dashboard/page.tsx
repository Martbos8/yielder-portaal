import { portalMetadata } from "@/lib/metadata";

export const metadata = portalMetadata("/dashboard");

/** Revalidate dashboard data every 2 minutes (matches CacheTTL.SHORT). */
export const revalidate = 120;

import Link from "next/link";
import {
  getCachedDashboardStats,
  getCachedRecommendations,
  getCachedUserCompanyId,
  getCachedDashboardTrends,
  getCachedRecentActivity,
  getRecentTickets,
  getExpiringAgreements,
  getExpiredWarrantyHardware,
} from "@/lib/repositories";
import type { Recommendation } from "@/lib/engine/recommendation";
import type { ActivityEntry } from "@/lib/repositories";
import { Badge } from "@/components/ui/badge";
import { MaterialIcon } from "@/components/icon";
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

/** Map audit log actions to human-readable Dutch labels. */
const ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  contact_request_created: { label: "Contactverzoek aangemaakt", icon: "mail" },
  notification_read: { label: "Notificatie gelezen", icon: "notifications" },
  all_notifications_read: { label: "Alle notificaties gelezen", icon: "done_all" },
  recommendation_feedback: { label: "Feedback op aanbeveling", icon: "thumb_up" },
  sync_completed: { label: "Synchronisatie voltooid", icon: "sync" },
  ticket_created: { label: "Ticket aangemaakt", icon: "confirmation_number" },
  ticket_updated: { label: "Ticket bijgewerkt", icon: "edit" },
  hardware_synced: { label: "Hardware gesynchroniseerd", icon: "laptop_mac" },
  agreement_synced: { label: "Contract gesynchroniseerd", icon: "verified_user" },
  login: { label: "Ingelogd", icon: "login" },
};

function formatActivityAction(entry: ActivityEntry): { label: string; icon: string } {
  return ACTION_LABELS[entry.action] ?? { label: entry.action.replace(/_/g, " "), icon: "info" };
}

/** Format relative time in Dutch (e.g. "2 uur geleden"). */
function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Zojuist";
  if (diffMin < 60) return `${diffMin} min geleden`;
  if (diffHrs < 24) return `${diffHrs} uur geleden`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "dag" : "dagen"} geleden`;
  return formatDate(dateStr);
}

/** Sort attention items by urgency. Expired warranties first, then by date proximity. */
function sortAttentionItems(
  agreements: Array<{ id: string; name: string; end_date: string | null }>,
  warranty: Array<{ id: string; name: string; warranty_expiry: string | null }>
): Array<{ id: string; name: string; date: string | null; type: "warranty" | "agreement"; urgencyDays: number }> {
  const now = new Date().getTime();
  const items = [
    ...warranty.map((w) => ({
      id: w.id,
      name: w.name,
      date: w.warranty_expiry,
      type: "warranty" as const,
      urgencyDays: w.warranty_expiry ? Math.floor((new Date(w.warranty_expiry).getTime() - now) / 86400000) : -999,
    })),
    ...agreements.map((a) => ({
      id: a.id,
      name: a.name,
      date: a.end_date,
      type: "agreement" as const,
      urgencyDays: a.end_date ? Math.floor((new Date(a.end_date).getTime() - now) / 86400000) : 999,
    })),
  ];
  return items.sort((a, b) => a.urgencyDays - b.urgencyDays);
}

export default async function DashboardPage() {
  const [stats, recentTickets, expiringAgreements, expiredWarranty, topRecommendations, trends, recentActivity] =
    await Promise.all([
      getCachedDashboardStats(),
      getRecentTickets(5),
      getExpiringAgreements(30),
      getExpiredWarrantyHardware(),
      getTopRecommendations(),
      getCachedDashboardTrends().catch(() => null),
      getCachedRecentActivity(10).catch(() => []),
    ]);

  const kpis = [
    {
      label: "Open tickets",
      value: String(stats.openTickets),
      icon: "confirmation_number",
      trend: trends?.ticketTrend,
      sparkline: trends?.ticketSparkline,
      trendLabel: "vs vorige maand",
    },
    {
      label: "Hardware",
      value: String(stats.hardwareCount),
      icon: "laptop_mac",
      trend: trends?.hardwareTrend,
      trendLabel: "vs vorige maand",
    },
    {
      label: "Contracten",
      value: String(stats.activeContracts),
      icon: "verified_user",
      trend: trends?.contractTrend,
      trendLabel: "vs vorige maand",
    },
    {
      label: "Maandbedrag",
      value: formatCurrency(stats.monthlyAmount),
      icon: "payments",
      trend: trends?.amountTrend,
      trendLabel: "vs vorige maand",
    },
  ];

  const attentionItems = sortAttentionItems(expiringAgreements, expiredWarranty);

  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Dashboard</h1>

      {/* KPI grid — 4 cols desktop, 2 tablet, 1 mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
            trendLabel={kpi.trendLabel}
            sparkline={kpi.sparkline}
          />
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Link
          href="/tickets"
          className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card shadow-card
            hover:shadow-card-hover hover:border-yielder-navy/20 transition-all group"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yielder-navy/10 text-yielder-navy group-hover:bg-yielder-navy group-hover:text-white transition-colors">
            <MaterialIcon name="confirmation_number" size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Tickets bekijken</p>
            <p className="text-xs text-muted-foreground">Bekijk uw openstaande tickets</p>
          </div>
        </Link>
        <Link
          href="/contact"
          className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card shadow-card
            hover:shadow-card-hover hover:border-yielder-navy/20 transition-all group"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yielder-orange/10 text-yielder-orange group-hover:bg-yielder-orange group-hover:text-white transition-colors">
            <MaterialIcon name="support_agent" size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Contact opnemen</p>
            <p className="text-xs text-muted-foreground">Stel een vraag aan ons team</p>
          </div>
        </Link>
        <Link
          href="/contracten"
          className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card shadow-card
            hover:shadow-card-hover hover:border-yielder-navy/20 transition-all group"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <MaterialIcon name="description" size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Contracten</p>
            <p className="text-xs text-muted-foreground">Beheer uw overeenkomsten</p>
          </div>
        </Link>
      </div>

      {/* Main widget grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aanbevelingen voor u — full width */}
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

        {/* Aandachtspunten — sorted by urgency */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Aandachtspunten
          </h2>

          {attentionItems.length === 0 ? (
            <EmptyStateInline icon="check_circle" message="Geen aandachtspunten" />
          ) : (
            <ul className="space-y-2">
              {attentionItems.map((item) => {
                const isExpired = item.urgencyDays < 0;
                const isUrgent = item.urgencyDays >= 0 && item.urgencyDays <= 7;
                const badgeClass = isExpired
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : isUrgent
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
                const icon = item.type === "warranty" ? "memory" : "verified_user";
                const badgeText = isExpired
                  ? `Verlopen ${formatDate(item.date)}`
                  : `Verloopt ${formatDate(item.date)}`;

                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <MaterialIcon
                      name={icon}
                      size={16}
                      className={isExpired ? "text-red-500" : isUrgent ? "text-orange-500" : "text-yellow-500"}
                    />
                    <span className="text-sm font-medium text-foreground truncate flex-1">
                      {item.name}
                    </span>
                    <Badge className={`shrink-0 text-[10px] ${badgeClass}`}>
                      {badgeText}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recente activiteit — full width */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Recente activiteit
          </h2>

          {recentActivity.length === 0 ? (
            <EmptyStateInline icon="history" message="Geen recente activiteit" />
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />
              <ul className="space-y-3">
                {recentActivity.map((entry) => {
                  const { label, icon } = formatActivityAction(entry);
                  return (
                    <li key={entry.id} className="flex items-start gap-3 relative">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted border border-border z-10 shrink-0">
                        <MaterialIcon name={icon} size={12} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(entry.createdAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
