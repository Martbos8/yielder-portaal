/** Revalidate contract data every 5 minutes. */
export const revalidate = 300;

import { getAgreements } from "@/lib/repositories";
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
import {
  getExpiryBadge,
  countExpiringSoon,
  isManagedService,
  isMissingManagedCoverage,
} from "@/lib/contract-utils";
import Link from "next/link";

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

/**
 * Finds active agreements that don't have managed service coverage.
 */
function getUncoveredAgreements(agreements: Agreement[]): Agreement[] {
  const active = agreements.filter((a) => a.status === "active");
  // Only show uncovered if there are active agreements but no managed service
  const hasManagedService = active.some((a) => isManagedService(a));
  if (hasManagedService) return [];
  // Return non-managed-service agreements that could benefit from coverage
  return active.filter((a) => !isManagedService(a));
}

export default async function ContractenPage() {
  const agreements = await getAgreements();
  const sorted = sortAgreements(agreements);

  const totalMonthly = agreements
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + (a.bill_amount ?? 0), 0);

  const expiringCount = countExpiringSoon(agreements);
  const missingManagedCoverage = isMissingManagedCoverage(agreements);
  const uncoveredAgreements = getUncoveredAgreements(agreements);

  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Contracten</h1>

      {/* Banner: expiring contracts */}
      {expiringCount > 0 && (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 flex items-center gap-3 shadow-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
            <MaterialIcon name="schedule" className="text-orange-600" size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-800">
              {expiringCount} {expiringCount === 1 ? "contract verloopt" : "contracten verlopen"} binnenkort
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              Neem contact op met het team om uw contracten tijdig te verlengen.
            </p>
          </div>
          <Link
            href="/upgrade"
            className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-xs font-medium text-white hover:bg-orange-600 transition-colors"
          >
            Bekijk aanbevelingen
          </Link>
        </div>
      )}

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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((agreement) => {
              const config = statusConfig[agreement.status];
              const expiryBadge = agreement.status === "active"
                ? getExpiryBadge(agreement.end_date)
                : { show: false, daysLeft: 0, text: "" };

              return (
                <Card
                  key={agreement.id}
                  className={expiryBadge.show ? "ring-1 ring-orange-200" : ""}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="truncate">{agreement.name}</CardTitle>
                      {expiryBadge.show && (
                        <Badge
                          className={
                            expiryBadge.daysLeft <= 7
                              ? "bg-red-100 text-red-700 whitespace-nowrap shrink-0"
                              : "bg-orange-100 text-orange-700 whitespace-nowrap shrink-0"
                          }
                        >
                          <MaterialIcon
                            name={expiryBadge.daysLeft <= 7 ? "error" : "schedule"}
                            size={12}
                            className="mr-1"
                          />
                          {expiryBadge.text}
                        </Badge>
                      )}
                    </div>
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

          {/* Ontbrekende dekking sectie */}
          {missingManagedCoverage && uncoveredAgreements.length > 0 && (
            <section className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <MaterialIcon
                  name="shield"
                  className="text-yielder-navy/70"
                  size={20}
                />
                <h2 className="text-sm font-semibold text-foreground">
                  Ontbrekende dekking
                </h2>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-card">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <MaterialIcon name="info" className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      Managed service aanbevolen
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      U heeft {uncoveredAgreements.length} actieve{" "}
                      {uncoveredAgreements.length === 1 ? "contract" : "contracten"}{" "}
                      zonder managed service dekking. Een managed service biedt proactief beheer,
                      monitoring en snellere oplostijden.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {uncoveredAgreements.slice(0, 5).map((agreement) => (
                    <div
                      key={agreement.id}
                      className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-sm"
                    >
                      <span className="text-blue-900 font-medium truncate">
                        {agreement.name}
                      </span>
                      <Badge className="bg-blue-100 text-blue-700 whitespace-nowrap ml-2">
                        Geen managed service
                      </Badge>
                    </div>
                  ))}
                  {uncoveredAgreements.length > 5 && (
                    <p className="text-xs text-blue-600 pl-3">
                      en {uncoveredAgreements.length - 5} meer...
                    </p>
                  )}
                </div>

                <Link
                  href="/upgrade"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <MaterialIcon name="mail" size={14} />
                  Neem contact op
                </Link>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
