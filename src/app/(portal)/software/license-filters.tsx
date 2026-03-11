"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MaterialIcon } from "@/components/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { License, LicenseStatus } from "@/types/database";

const statusConfig: Record<
  LicenseStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Actief",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  expiring: {
    label: "Verloopt binnenkort",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  expired: {
    label: "Verlopen",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

const statusOptions = [
  { value: "", label: "Alle statussen" },
  { value: "active", label: "Actief" },
  { value: "expiring", label: "Verloopt binnenkort" },
  { value: "expired", label: "Verlopen" },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function getUniqueVendors(licenses: License[]): string[] {
  const vendors = new Set(licenses.map((l) => l.vendor));
  return Array.from(vendors).sort((a, b) => a.localeCompare(b, "nl-NL"));
}

function SeatBar({ used, total }: { used: number; total: number }) {
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  const isHigh = percentage >= 90;
  const isMedium = percentage >= 70 && percentage < 90;

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isHigh
              ? "bg-red-500"
              : isMedium
                ? "bg-orange-400"
                : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {used}/{total}
      </span>
    </div>
  );
}

export function LicenseFilters({ licenses }: { licenses: License[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("zoek") ?? "";
  const vendorFilter = searchParams.get("vendor") ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  const vendors = useMemo(() => getUniqueVendors(licenses), [licenses]);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const filtered = useMemo(() => {
    return licenses.filter((license) => {
      if (
        search &&
        !license.product_name.toLowerCase().includes(search.toLowerCase()) &&
        !license.vendor.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (vendorFilter && license.vendor !== vendorFilter) {
        return false;
      }
      if (statusFilter && license.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [licenses, search, vendorFilter, statusFilter]);

  const totalSeats = filtered.reduce((sum, l) => sum + l.seats_total, 0);
  const usedSeats = filtered.reduce((sum, l) => sum + l.seats_used, 0);

  return (
    <div>
      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Totaal licenties
          </p>
          <p className="text-2xl font-semibold text-yielder-navy">
            {filtered.length}
          </p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Seats gebruikt
          </p>
          <p className="text-2xl font-semibold text-yielder-navy">
            {usedSeats}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              / {totalSeats}
            </span>
          </p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Maandkosten
          </p>
          <p className="text-2xl font-semibold text-yielder-navy">
            {formatCurrency(
              filtered.reduce(
                (sum, l) =>
                  sum + (l.cost_per_seat ?? 0) * l.seats_total,
                0
              )
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <MaterialIcon
            name="search"
            size={18}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Zoek op product of vendor…"
            value={search}
            onChange={(e) => updateParams("zoek", e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={vendorFilter}
          onChange={(e) => updateParams("vendor", e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Alle vendors</option>
          {vendors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => updateParams("status", e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {filtered.length} {filtered.length === 1 ? "licentie" : "licenties"}
      </p>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MaterialIcon
              name="key"
              className="text-muted-foreground/50 mb-3"
              size={40}
            />
            <p className="text-sm">Geen licenties gevonden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-[120px] hidden md:table-cell">Type</TableHead>
                  <TableHead className="w-[160px]">Seats</TableHead>
                  <TableHead className="w-[130px] hidden sm:table-cell">Verloopdatum</TableHead>
                  <TableHead className="w-[100px] hidden md:table-cell">Prijs/seat</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((license) => {
                  const config = statusConfig[license.status];
                  return (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium text-sm">
                        {license.vendor}
                      </TableCell>
                      <TableCell className="text-sm">
                        {license.product_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                        {license.license_type ?? "—"}
                      </TableCell>
                      <TableCell>
                        <SeatBar
                          used={license.seats_used}
                          total={license.seats_total}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {formatDate(license.expiry_date)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                        {formatCurrency(license.cost_per_seat)}
                      </TableCell>
                      <TableCell>
                        <Badge className={config.className}>
                          {config.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
