import { getAgreements } from "@/lib/queries";
import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import type { Agreement, AgreementStatus } from "@/types/database";

const statusConfig: Record<
  AgreementStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Actief",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  expired: {
    label: "Verlopen",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  cancelled: {
    label: "Opgezegd",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

type SLATier = "premium" | "standaard" | "basis";

const slaTiers: Record<
  SLATier,
  {
    label: string;
    responseTime: string;
    resolveTarget: string;
    coverage: string;
    icon: string;
    className: string;
  }
> = {
  premium: {
    label: "Premium",
    responseTime: "1 uur",
    resolveTarget: "4 uur",
    coverage: "24/7",
    icon: "diamond",
    className: "text-yielder-orange",
  },
  standaard: {
    label: "Standaard",
    responseTime: "4 uur",
    resolveTarget: "8 uur",
    coverage: "Ma-Vr 08:00-18:00",
    icon: "verified",
    className: "text-yielder-navy",
  },
  basis: {
    label: "Basis",
    responseTime: "8 uur",
    resolveTarget: "24 uur",
    coverage: "Ma-Vr 09:00-17:00",
    icon: "shield",
    className: "text-muted-foreground",
  },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function getSLATier(agreement: Agreement): SLATier {
  const name = agreement.name.toLowerCase();
  if (name.includes("premium") || name.includes("24/7")) return "premium";
  if (name.includes("basis") || name.includes("basic")) return "basis";
  return "standaard";
}

function daysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function SupportcontractenPage() {
  const agreements = await getAgreements();
  const supportAgreements = agreements.filter(
    (a) => a.status === "active" || a.status === "expired"
  );

  const active = supportAgreements.filter((a) => a.status === "active");
  const totalMonthly = active.reduce(
    (sum, a) => sum + (a.bill_amount ?? 0),
    0
  );

  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Supportcontracten</h1>

      {/* SLA Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(Object.entries(slaTiers) as [SLATier, (typeof slaTiers)[SLATier]][]).map(
          ([key, tier]) => (
            <div
              key={key}
              className="bg-card rounded-2xl p-5 shadow-card border border-border"
            >
              <div className="flex items-center gap-2 mb-3">
                <MaterialIcon
                  name={tier.icon}
                  className={tier.className}
                  size={24}
                />
                <h3 className="font-semibold text-sm">{tier.label} SLA</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Responstijd</span>
                  <span className="font-medium">{tier.responseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Oplostijd</span>
                  <span className="font-medium">{tier.resolveTarget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dekking</span>
                  <span className="font-medium">{tier.coverage}</span>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Actieve contracten
          </p>
          <p className="text-2xl font-semibold text-yielder-navy">
            {active.length}
          </p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Maandkosten support
          </p>
          <p className="text-2xl font-semibold text-yielder-navy">
            {formatCurrency(totalMonthly)}
          </p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            SLA-niveau
          </p>
          <p className="text-2xl font-semibold text-yielder-navy">
            {active.length > 0 && active[0]
              ? slaTiers[getSLATier(active[0])].label
              : "—"}
          </p>
        </div>
      </div>

      {/* Contract cards */}
      {supportAgreements.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 shadow-card border border-border flex flex-col items-center justify-center text-muted-foreground">
          <MaterialIcon
            name="verified_user"
            className="text-muted-foreground/50 mb-3"
            size={48}
          />
          <p className="text-sm">Geen supportcontracten gevonden</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supportAgreements.map((agreement) => {
            const config = statusConfig[agreement.status];
            const tier = slaTiers[getSLATier(agreement)];
            const days = daysRemaining(agreement.end_date);
            const isExpiringSoon =
              days !== null && days > 0 && days <= 30;

            return (
              <Card key={agreement.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MaterialIcon
                        name={tier.icon}
                        className={tier.className}
                        size={20}
                      />
                      <CardTitle className="truncate">
                        {agreement.name}
                      </CardTitle>
                    </div>
                    <Badge className={config.className}>{config.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* SLA details */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Responstijd
                      </p>
                      <p className="font-medium">{tier.responseTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Oplostijd
                      </p>
                      <p className="font-medium">{tier.resolveTarget}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dekking</p>
                      <p className="font-medium">{tier.coverage}</p>
                    </div>
                  </div>

                  {/* Period and cost */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MaterialIcon name="calendar_today" size={14} />
                      <span>
                        {formatDate(agreement.start_date)} —{" "}
                        {formatDate(agreement.end_date)}
                      </span>
                    </div>
                    {agreement.bill_amount != null && (
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(agreement.bill_amount)}
                        <span className="text-xs text-muted-foreground">
                          /mnd
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Expiring soon warning */}
                  {isExpiringSoon && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                      <MaterialIcon name="warning" size={14} />
                      <span>
                        Verloopt over {days}{" "}
                        {days === 1 ? "dag" : "dagen"}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
