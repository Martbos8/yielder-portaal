import { getTickets } from "@/lib/repositories";
import {
  calculateSLAMetrics,
  getCategoryBreakdown,
  getMonthlyTrends,
  formatMinutes,
} from "@/lib/performance-stats";
import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { LazySLATrendChart, LazyCategoryChart } from "@/components/lazy-charts";
import { StatCard, EmptyStateInline } from "@/components/data-display";

function getComplianceBadge(percent: number): {
  label: string;
  className: string;
} {
  if (percent >= 95)
    return {
      label: "Uitstekend",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    };
  if (percent >= 80)
    return {
      label: "Goed",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
  if (percent >= 60)
    return {
      label: "Voldoende",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
  return {
    label: "Onvoldoende",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
}

export default async function PrestatiePage() {
  const tickets = await getTickets();
  const metrics = calculateSLAMetrics(tickets);
  const categories = getCategoryBreakdown(tickets);
  const trends = getMonthlyTrends(tickets);
  const complianceBadge = getComplianceBadge(metrics.slaCompliancePercent);

  const kpis = [
    {
      label: "Gem. responstijd",
      value: formatMinutes(metrics.avgResponseMinutes),
      icon: "speed",
      description: "Tijd tot eerste reactie",
    },
    {
      label: "Gem. oplostijd",
      value: formatMinutes(metrics.avgResolveMinutes),
      icon: "timer",
      description: "Tijd tot oplossing",
    },
    {
      label: "SLA-compliance",
      value: `${metrics.slaCompliancePercent}%`,
      icon: "verified",
      description: "Binnen SLA-doelstelling",
    },
    {
      label: "Opgeloste tickets",
      value: String(metrics.totalResolved),
      icon: "task_alt",
      description: `${metrics.totalBreached} buiten SLA`,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title text-2xl">Prestaties</h1>
        <Badge className={complianceBadge.className}>
          {complianceBadge.label}
        </Badge>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            description={kpi.description}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Trend chart */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Trend afgelopen 6 maanden
          </h2>
          {trends.some((t) => t.resolved > 0) ? (
            <LazySLATrendChart data={trends} />
          ) : (
            <EmptyStateInline
              icon="show_chart"
              message="Nog geen trenddata beschikbaar"
              iconClassName="text-muted-foreground/50"
            />
          )}
        </div>

        {/* Category chart */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Tickets per categorie
          </h2>
          {categories.length > 0 ? (
            <LazyCategoryChart data={categories} />
          ) : (
            <EmptyStateInline
              icon="bar_chart"
              message="Geen categoriedata beschikbaar"
              iconClassName="text-muted-foreground/50"
            />
          )}
        </div>
      </div>

      {/* SLA detail table */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          SLA-doelstellingen
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                  Prioriteit
                </th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                  Responstijd doel
                </th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                  Oplostijd doel
                </th>
                <th className="text-left py-2 text-muted-foreground font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  priority: "Urgent",
                  response: "15 min",
                  resolve: "1 uur",
                  icon: "error",
                  color: "text-red-500",
                },
                {
                  priority: "Hoog",
                  response: "30 min",
                  resolve: "4 uur",
                  icon: "warning",
                  color: "text-orange-500",
                },
                {
                  priority: "Normaal",
                  response: "2 uur",
                  resolve: "8 uur",
                  icon: "info",
                  color: "text-blue-500",
                },
                {
                  priority: "Laag",
                  response: "4 uur",
                  resolve: "24 uur",
                  icon: "arrow_downward",
                  color: "text-gray-400",
                },
              ].map((row) => (
                <tr
                  key={row.priority}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <MaterialIcon
                        name={row.icon}
                        className={row.color}
                        size={16}
                      />
                      <span className="font-medium">{row.priority}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">{row.response}</td>
                  <td className="py-3 pr-4">{row.resolve}</td>
                  <td className="py-3">
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Actief
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
