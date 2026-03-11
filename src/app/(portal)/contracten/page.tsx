import { getAgreements } from "@/lib/queries";
import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
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

function sortAgreements(agreements: Agreement[]): Agreement[] {
  return [...agreements].sort((a, b) => {
    // Active first
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    // Then by name
    return a.name.localeCompare(b.name, "nl-NL");
  });
}

export default async function ContractenPage() {
  const agreements = await getAgreements();
  const sorted = sortAgreements(agreements);

  const totalMonthly = agreements
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + (a.bill_amount ?? 0), 0);

  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Contracten</h1>

      {/* Totaal maandbedrag */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Totaal maandbedrag
        </p>
        <p className="text-2xl font-semibold text-yielder-navy">
          {formatCurrency(totalMonthly)}
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 shadow-card border border-border flex flex-col items-center justify-center text-muted-foreground">
          <MaterialIcon
            name="description"
            className="text-muted-foreground/50 mb-3"
            size={48}
          />
          <p className="text-sm">Geen contracten gevonden</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((agreement) => {
            const config = statusConfig[agreement.status];
            return (
              <Card key={agreement.id}>
                <CardHeader>
                  <CardTitle className="truncate">{agreement.name}</CardTitle>
                  {agreement.type && (
                    <CardDescription>{agreement.type}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={config.className}>{config.label}</Badge>
                    {agreement.bill_amount != null && (
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(agreement.bill_amount)}
                        <span className="text-xs text-muted-foreground">
                          /mnd
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MaterialIcon name="calendar_today" size={14} />
                    <span>
                      {formatDate(agreement.start_date)} —{" "}
                      {formatDate(agreement.end_date)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
