"use client";

import { useMemo } from "react";
import type { License } from "@/types/database";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  DataTable,
  StatCardCompact,
  StatusBadge,
  licenseStatusConfig,
} from "@/components/data-display";
import type { ColumnDef, FilterOption } from "@/components/data-display";

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

const statusFilterOptions: FilterOption[] = [
  { value: "active", label: "Actief" },
  { value: "expiring", label: "Verloopt binnenkort" },
  { value: "expired", label: "Verlopen" },
];

export function LicenseFilters({ licenses }: { licenses: License[] }) {
  const vendorOptions: FilterOption[] = useMemo(() => {
    const vendors = new Set(licenses.map((l) => l.vendor));
    return Array.from(vendors)
      .sort((a, b) => a.localeCompare(b, "nl-NL"))
      .map((v) => ({ value: v, label: v }));
  }, [licenses]);

  const columns: ColumnDef<License>[] = useMemo(
    () => [
      {
        key: "vendor",
        header: "Vendor",
        cellClassName: "font-medium text-sm",
        sortable: true,
        sortValue: (row) => row.vendor,
        filterType: "select" as const,
        filterOptions: vendorOptions,
        filterPlaceholder: "Alle vendors",
        filterValue: (row) => row.vendor,
        cell: (row) => row.vendor,
      },
      {
        key: "product",
        header: "Product",
        cellClassName: "text-sm",
        sortable: true,
        sortValue: (row) => row.product_name,
        cell: (row) => row.product_name,
      },
      {
        key: "type",
        header: "Type",
        headerClassName: "w-[120px]",
        cellClassName: "text-sm text-muted-foreground",
        hideBelow: "md" as const,
        sortable: true,
        sortValue: (row) => row.license_type ?? "",
        cell: (row) => row.license_type ?? "—",
      },
      {
        key: "seats",
        header: "Seats",
        headerClassName: "w-[160px]",
        sortable: true,
        sortValue: (row) =>
          row.seats_total > 0
            ? Math.round((row.seats_used / row.seats_total) * 100)
            : 0,
        cell: (row) => (
          <SeatBar used={row.seats_used} total={row.seats_total} />
        ),
      },
      {
        key: "expiry",
        header: "Verloopdatum",
        headerClassName: "w-[130px]",
        cellClassName: "text-sm text-muted-foreground",
        hideBelow: "sm" as const,
        sortable: true,
        sortValue: (row) => row.expiry_date ?? "",
        cell: (row) => formatDate(row.expiry_date),
      },
      {
        key: "cost",
        header: "Prijs/seat",
        headerClassName: "w-[100px]",
        cellClassName: "text-sm text-muted-foreground",
        hideBelow: "md" as const,
        sortable: true,
        sortValue: (row) => row.cost_per_seat ?? 0,
        cell: (row) => formatCurrency(row.cost_per_seat),
      },
      {
        key: "status",
        header: "Status",
        headerClassName: "w-[140px]",
        sortable: true,
        sortValue: (row) => row.status,
        filterType: "select" as const,
        filterOptions: statusFilterOptions,
        filterPlaceholder: "Alle statussen",
        filterValue: (row) => row.status,
        cell: (row) => (
          <StatusBadge status={row.status} config={licenseStatusConfig} />
        ),
      },
    ],
    [vendorOptions]
  );

  const totalSeats = licenses.reduce((sum, l) => sum + l.seats_total, 0);
  const usedSeats = licenses.reduce((sum, l) => sum + l.seats_used, 0);
  const monthlyCost = licenses.reduce(
    (sum, l) => sum + (l.cost_per_seat ?? 0) * l.seats_total,
    0
  );

  return (
    <DataTable<License>
      columns={columns}
      data={licenses}
      rowKey={(row) => row.id}
      searchable
      searchPlaceholder="Zoek op product of vendor…"
      searchFields={(row) => [row.product_name, row.vendor]}
      emptyIcon="key"
      emptyMessage="Geen licenties gevonden"
      defaultPageSize={25}
      toolbar={
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCardCompact
            label="Totaal licenties"
            value={String(licenses.length)}
          />
          <StatCardCompact
            label="Seats gebruikt"
            value={String(usedSeats)}
            suffix={`/ ${totalSeats}`}
          />
          <StatCardCompact
            label="Maandkosten"
            value={formatCurrency(monthlyCost) ?? "—"}
          />
        </div>
      }
    />
  );
}
