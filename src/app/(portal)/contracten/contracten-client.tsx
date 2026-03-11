"use client";

import { useState, useMemo } from "react";
import type { Agreement } from "@/types/database";
import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  getExpiryBadge,
  daysUntilExpiry,
  isManagedService,
} from "@/lib/contract-utils";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  StatCardCompact,
  StatusBadge,
  EmptyState,
  agreementStatusConfig,
} from "@/components/data-display";

// ── Helpers ──────────────────────────────────────────────────────

function sortAgreements(agreements: Agreement[]): Agreement[] {
  return [...agreements].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return a.name.localeCompare(b.name, "nl-NL");
  });
}

function computeTimelineProgress(
  startDate: string | null,
  endDate: string | null
): { percent: number; status: "active" | "ending" | "expired" | "unknown" } {
  if (!startDate || !endDate) return { percent: 0, status: "unknown" };
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const total = end - start;
  if (total <= 0) return { percent: 100, status: "expired" };
  const elapsed = now - start;
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
  if (now > end) return { percent: 100, status: "expired" };
  if (pct > 80) return { percent: pct, status: "ending" };
  return { percent: pct, status: "active" };
}

function getTimelineColor(status: "active" | "ending" | "expired" | "unknown"): string {
  switch (status) {
    case "active": return "bg-emerald-500";
    case "ending": return "bg-orange-500";
    case "expired": return "bg-red-500";
    case "unknown": return "bg-gray-300";
  }
}

function computeCostBreakdown(agreements: Agreement[]): {
  monthly: number;
  yearly: number;
  totalContractValue: number;
} {
  const active = agreements.filter((a) => a.status === "active");
  const monthly = active.reduce((sum, a) => sum + (a.bill_amount ?? 0), 0);
  const yearly = monthly * 12;

  // Total contract value: sum bill_amount * months for each contract
  const totalContractValue = active.reduce((sum, a) => {
    if (!a.bill_amount || !a.start_date || !a.end_date) return sum;
    const start = new Date(a.start_date);
    const end = new Date(a.end_date);
    const months = Math.max(
      1,
      (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth())
    );
    return sum + a.bill_amount * months;
  }, 0);

  return { monthly, yearly, totalContractValue };
}

// ── Timeline Component ──────────────────────────────────────────

function ContractTimeline({
  startDate,
  endDate,
}: {
  startDate: string | null;
  endDate: string | null;
}) {
  const { percent, status } = computeTimelineProgress(startDate, endDate);
  const days = daysUntilExpiry(endDate);

  if (status === "unknown") return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{formatDate(startDate)}</span>
        <span>{formatDate(endDate)}</span>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${getTimelineColor(status)}`}
          style={{ width: `${percent}%` }}
        />
        {/* Now marker */}
        {status !== "expired" && (
          <div
            className="absolute top-0 h-2 w-0.5 bg-yielder-navy"
            style={{ left: `${percent}%` }}
            title="Nu"
          />
        )}
      </div>
      <div className="text-[10px] text-muted-foreground text-center">
        {status === "expired" ? (
          <span className="text-red-600 font-medium">Verlopen</span>
        ) : days !== null && days > 0 ? (
          <span>
            Nog{" "}
            <span className="font-medium text-foreground">
              {days > 365
                ? `${Math.floor(days / 365)} jaar`
                : days > 30
                  ? `${Math.floor(days / 30)} maanden`
                  : `${days} dagen`}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ── Compare Modal ───────────────────────────────────────────────

function ComparePanel({
  contracts,
  onClose,
}: {
  contracts: Agreement[];
  onClose: () => void;
}) {
  const rows: { label: string; getValue: (a: Agreement) => string }[] = [
    { label: "Status", getValue: (a) => a.status },
    { label: "Type", getValue: (a) => a.type ?? "—" },
    {
      label: "Maandbedrag",
      getValue: (a) => (a.bill_amount != null ? formatCurrency(a.bill_amount) : "—"),
    },
    {
      label: "Jaarbedrag",
      getValue: (a) =>
        a.bill_amount != null ? formatCurrency(a.bill_amount * 12) : "—",
    },
    { label: "Startdatum", getValue: (a) => formatDate(a.start_date) },
    { label: "Einddatum", getValue: (a) => formatDate(a.end_date) },
    {
      label: "Resterende dagen",
      getValue: (a) => {
        const d = daysUntilExpiry(a.end_date);
        return d !== null ? (d > 0 ? `${d} dagen` : "Verlopen") : "—";
      },
    },
    {
      label: "Managed service",
      getValue: (a) => (isManagedService(a) ? "Ja" : "Nee"),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-yielder-navy">
            Contracten vergelijken
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-muted transition-colors"
            aria-label="Sluiten"
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">
                  Kenmerk
                </th>
                {contracts.map((c) => (
                  <th
                    key={c.id}
                    className="text-left p-3 font-semibold text-yielder-navy max-w-[200px] truncate"
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b last:border-0">
                  <td className="p-3 text-muted-foreground font-medium">
                    {row.label}
                  </td>
                  {contracts.map((c) => (
                    <td key={c.id} className="p-3">
                      {row.getValue(c)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-3 text-muted-foreground font-medium">
                  Looptijd
                </td>
                {contracts.map((c) => (
                  <td key={c.id} className="p-3">
                    <ContractTimeline
                      startDate={c.start_date}
                      endDate={c.end_date}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────

interface ContractenClientProps {
  agreements: Agreement[];
  expiringCount: number;
  missingManagedCoverage: boolean;
  uncoveredAgreements: Agreement[];
}

export function ContractenClient({
  agreements,
  expiringCount,
  missingManagedCoverage,
  uncoveredAgreements,
}: ContractenClientProps) {
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const sorted = useMemo(() => sortAgreements(agreements), [agreements]);
  const costs = useMemo(() => computeCostBreakdown(agreements), [agreements]);

  const activeCount = agreements.filter((a) => a.status === "active").length;
  const expiredCount = agreements.filter((a) => a.status !== "active").length;

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  }

  const compareContracts = useMemo(
    () => agreements.filter((a) => compareIds.has(a.id)),
    [agreements, compareIds]
  );

  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Contracten</h1>

      {/* Banner: expiring contracts */}
      {expiringCount > 0 && (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 flex items-center gap-3 shadow-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
            <MaterialIcon
              name="schedule"
              className="text-orange-600"
              size={22}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-800">
              {expiringCount}{" "}
              {expiringCount === 1
                ? "contract verloopt"
                : "contracten verlopen"}{" "}
              binnenkort
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

      {/* Cost breakdown strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCardCompact
          label="Maandelijks"
          value={formatCurrency(costs.monthly)}
        />
        <StatCardCompact
          label="Jaarlijks"
          value={formatCurrency(costs.yearly)}
        />
        <StatCardCompact
          label="Totale contractwaarde"
          value={formatCurrency(costs.totalContractValue)}
        />
      </div>

      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          {activeCount} actief
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400" />
          {expiredCount} inactief
        </div>

        {/* Compare button */}
        {compareIds.size >= 2 && (
          <button
            onClick={() => setShowCompare(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-yielder-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-yielder-navy/90 transition-colors"
          >
            <MaterialIcon name="compare_arrows" size={14} />
            Vergelijk ({compareIds.size})
          </button>
        )}
        {compareIds.size > 0 && compareIds.size < 2 && (
          <span className="ml-auto text-xs text-muted-foreground">
            Selecteer nog {2 - compareIds.size} contract(en) om te vergelijken
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon="description" message="Geen contracten gevonden" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((agreement) => {
              const expiryBadge =
                agreement.status === "active"
                  ? getExpiryBadge(agreement.end_date)
                  : { show: false, daysLeft: 0, text: "" };
              const isSelected = compareIds.has(agreement.id);
              const days = daysUntilExpiry(agreement.end_date);
              const isRenewalSoon =
                agreement.status === "active" &&
                days !== null &&
                days > 0 &&
                days <= 60;

              return (
                <Card
                  key={agreement.id}
                  className={`relative transition-shadow ${
                    isSelected
                      ? "ring-2 ring-yielder-navy shadow-card-hover"
                      : expiryBadge.show
                        ? "ring-1 ring-orange-200"
                        : ""
                  }`}
                >
                  {/* Compare checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompare(agreement.id);
                    }}
                    className={`absolute top-3 right-3 z-10 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "border-yielder-navy bg-yielder-navy text-white"
                        : "border-muted-foreground/30 hover:border-yielder-navy/50"
                    }`}
                    aria-label={`Selecteer ${agreement.name} om te vergelijken`}
                    title="Vergelijk"
                  >
                    {isSelected && (
                      <MaterialIcon name="check" size={14} />
                    )}
                  </button>

                  <CardHeader className="pr-10">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="truncate">
                        {agreement.name}
                      </CardTitle>
                      {expiryBadge.show && (
                        <Badge
                          className={
                            expiryBadge.daysLeft <= 7
                              ? "bg-red-100 text-red-700 whitespace-nowrap shrink-0"
                              : "bg-orange-100 text-orange-700 whitespace-nowrap shrink-0"
                          }
                        >
                          <MaterialIcon
                            name={
                              expiryBadge.daysLeft <= 7 ? "error" : "schedule"
                            }
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
                    {/* Status + amount */}
                    <div className="flex items-center justify-between">
                      <StatusBadge
                        status={agreement.status}
                        config={agreementStatusConfig}
                      />
                      {agreement.bill_amount != null && (
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(agreement.bill_amount)}
                          <span className="text-xs text-muted-foreground">
                            /mnd
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Timeline visualization */}
                    <ContractTimeline
                      startDate={agreement.start_date}
                      endDate={agreement.end_date}
                    />

                    {/* Cost details */}
                    {agreement.bill_amount != null && agreement.bill_amount > 0 && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {formatCurrency(agreement.bill_amount * 12)}/jaar
                        </span>
                      </div>
                    )}

                    {/* Renewal reminder */}
                    {isRenewalSoon && (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                        <MaterialIcon
                          name="notifications_active"
                          size={16}
                          className="text-amber-600 shrink-0"
                        />
                        <span className="text-xs text-amber-800">
                          Verlenging over{" "}
                          <strong>{days} {days === 1 ? "dag" : "dagen"}</strong>{" "}
                          — neem tijdig contact op
                        </span>
                      </div>
                    )}

                    {/* Savings potential link */}
                    {agreement.status === "active" && (
                      <Link
                        href="/upgrade"
                        className="flex items-center gap-1 text-xs text-yielder-navy/70 hover:text-yielder-navy transition-colors"
                      >
                        <MaterialIcon name="savings" size={14} />
                        <span>Besparingspotentieel bekijken</span>
                      </Link>
                    )}
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
                    <MaterialIcon
                      name="info"
                      className="text-blue-600"
                      size={20}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      Managed service aanbevolen
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      U heeft {uncoveredAgreements.length} actieve{" "}
                      {uncoveredAgreements.length === 1
                        ? "contract"
                        : "contracten"}{" "}
                      zonder managed service dekking. Een managed service biedt
                      proactief beheer, monitoring en snellere oplostijden.
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

      {/* Compare panel */}
      {showCompare && compareContracts.length >= 2 && (
        <ComparePanel
          contracts={compareContracts}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}
