"use client";

import { useState, useMemo, useCallback } from "react";
import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { HardwareAsset, HardwareAssetType } from "@/types/database";
import {
  getWarrantyStatus,
  getHardwareUpgradeInfo,
  type WarrantyStatus,
} from "@/lib/hardware-utils";
import { HardwareDetailModal } from "@/components/hardware-detail-modal";
import { EmptyState, EmptyStateInline, warrantyStatusConfig } from "@/components/data-display";
import Link from "next/link";

// ── Constants ─────────────────────────────────────────────────────

const typeOrder: HardwareAssetType[] = [
  "Desktop",
  "Laptop",
  "Server",
  "Netwerk",
  "Overig",
];

const typeIcons: Record<HardwareAssetType, string> = {
  Desktop: "desktop_windows",
  Laptop: "laptop_mac",
  Server: "dns",
  Netwerk: "router",
  Overig: "devices_other",
};

type GroupBy = "type" | "status" | "assigned";

const groupByLabels: Record<GroupBy, string> = {
  type: "Type",
  status: "Status",
  assigned: "Toegewezen aan",
};

// ── Helpers ───────────────────────────────────────────────────────

function formatWarrantyText(warrantyExpiry: string | null): string {
  if (!warrantyExpiry) return "Garantie onbekend";
  const expiry = new Date(warrantyExpiry);
  const formatted = expiry.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const status = getWarrantyStatus(warrantyExpiry);
  if (status === "expired") return `Verlopen op ${formatted}`;
  return `Geldig t/m ${formatted}`;
}

function getHealthScore(asset: HardwareAsset): number {
  let score = 100;
  const warranty = getWarrantyStatus(asset.warranty_expiry);

  // Warranty status impacts score
  if (warranty === "expired") score -= 40;
  else if (warranty === "expiring") score -= 20;
  else if (warranty === "unknown") score -= 10;

  // Age factor (based on created_at as proxy for when it was registered)
  if (asset.warranty_expiry) {
    const expiry = new Date(asset.warranty_expiry);
    const now = new Date();
    const monthsToExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsToExpiry < 0) {
      // Expired: deduct more the longer it's been expired
      const monthsExpired = Math.abs(monthsToExpiry);
      score -= Math.min(20, Math.floor(monthsExpired * 2));
    } else if (monthsToExpiry < 3) {
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}

function getHealthColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-orange-500";
  return "text-red-600";
}

function getHealthBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function getWarrantyStatusLabel(status: WarrantyStatus): string {
  switch (status) {
    case "valid": return "Geldig";
    case "expiring": return "Verloopt binnenkort";
    case "expired": return "Verlopen";
    case "unknown": return "Onbekend";
  }
}

/** Lifecycle progress bar: 0% (new) → 100% (warranty expired) */
function getLifecycleProgress(asset: HardwareAsset): number | null {
  if (!asset.warranty_expiry) return null;

  const created = new Date(asset.created_at);
  const expiry = new Date(asset.warranty_expiry);
  const now = new Date();

  const totalSpan = expiry.getTime() - created.getTime();
  if (totalSpan <= 0) return 100;

  const elapsed = now.getTime() - created.getTime();
  const pct = (elapsed / totalSpan) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function getLifecycleColor(pct: number): string {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 80) return "bg-orange-500";
  return "bg-green-500";
}

function groupAssets(
  assets: HardwareAsset[],
  groupBy: GroupBy
): Array<{ key: string; label: string; icon: string; assets: HardwareAsset[] }> {
  if (groupBy === "type") {
    const groups: Record<HardwareAssetType, HardwareAsset[]> = {
      Desktop: [],
      Laptop: [],
      Server: [],
      Netwerk: [],
      Overig: [],
    };
    for (const asset of assets) {
      const type = typeOrder.includes(asset.type) ? asset.type : "Overig";
      groups[type].push(asset);
    }
    return typeOrder
      .filter((t) => groups[t].length > 0)
      .map((t) => ({
        key: t,
        label: t,
        icon: typeIcons[t],
        assets: groups[t],
      }));
  }

  if (groupBy === "status") {
    const statusGroups: Record<WarrantyStatus, HardwareAsset[]> = {
      expired: [],
      expiring: [],
      valid: [],
      unknown: [],
    };
    for (const asset of assets) {
      const s = getWarrantyStatus(asset.warranty_expiry);
      statusGroups[s].push(asset);
    }
    const statusOrder: WarrantyStatus[] = ["expired", "expiring", "valid", "unknown"];
    const statusIcons: Record<WarrantyStatus, string> = {
      expired: "cancel",
      expiring: "warning",
      valid: "check_circle",
      unknown: "help",
    };
    return statusOrder
      .filter((s) => statusGroups[s].length > 0)
      .map((s) => ({
        key: s,
        label: getWarrantyStatusLabel(s),
        icon: statusIcons[s],
        assets: statusGroups[s],
      }));
  }

  // groupBy === "assigned"
  const assignedMap = new Map<string, HardwareAsset[]>();
  const unassigned: HardwareAsset[] = [];
  for (const asset of assets) {
    if (asset.assigned_to) {
      const existing = assignedMap.get(asset.assigned_to);
      if (existing) {
        existing.push(asset);
      } else {
        assignedMap.set(asset.assigned_to, [asset]);
      }
    } else {
      unassigned.push(asset);
    }
  }
  const groups: Array<{ key: string; label: string; icon: string; assets: HardwareAsset[] }> = [];
  const sortedKeys = Array.from(assignedMap.keys()).sort((a, b) => a.localeCompare(b, "nl-NL"));
  for (const key of sortedKeys) {
    const groupAssets = assignedMap.get(key);
    if (groupAssets) {
      groups.push({ key, label: key, icon: "person", assets: groupAssets });
    }
  }
  if (unassigned.length > 0) {
    groups.push({ key: "__unassigned", label: "Niet toegewezen", icon: "person_off", assets: unassigned });
  }
  return groups;
}

function assetMatchesSearch(asset: HardwareAsset, query: string): boolean {
  const q = query.toLowerCase();
  return (
    asset.name.toLowerCase().includes(q) ||
    (asset.serial_number?.toLowerCase().includes(q) ?? false) ||
    (asset.assigned_to?.toLowerCase().includes(q) ?? false) ||
    (asset.manufacturer?.toLowerCase().includes(q) ?? false) ||
    (asset.model?.toLowerCase().includes(q) ?? false)
  );
}

function exportToCsv(assets: HardwareAsset[]): void {
  const headers = ["Naam", "Type", "Fabrikant", "Model", "Serienummer", "Toegewezen aan", "Garantie verloopt", "Status"];
  const rows = assets.map((a) => [
    a.name,
    a.type,
    a.manufacturer ?? "",
    a.model ?? "",
    a.serial_number ?? "",
    a.assigned_to ?? "",
    a.warranty_expiry ?? "",
    getWarrantyStatusLabel(getWarrantyStatus(a.warranty_expiry)),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hardware-export-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Components ────────────────────────────────────────────────────

interface HardwareClientProps {
  assets: HardwareAsset[];
  upgradeCount: number;
}

export function HardwareClient({ assets, upgradeCount }: HardwareClientProps) {
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("type");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredAssets = useMemo(
    () => (search ? assets.filter((a) => assetMatchesSearch(a, search)) : assets),
    [assets, search]
  );

  const groups = useMemo(
    () => groupAssets(filteredAssets, groupBy),
    [filteredAssets, groupBy]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
    }
  }, [filteredAssets, selectedIds.size]);

  const handleExport = useCallback(() => {
    const toExport = selectedIds.size > 0
      ? assets.filter((a) => selectedIds.has(a.id))
      : filteredAssets;
    exportToCsv(toExport);
  }, [assets, filteredAssets, selectedIds]);

  // Summary stats
  const statusCounts = useMemo(() => {
    const counts = { valid: 0, expiring: 0, expired: 0, unknown: 0 };
    for (const a of assets) {
      const s = getWarrantyStatus(a.warranty_expiry);
      counts[s]++;
    }
    return counts;
  }, [assets]);

  const avgHealth = useMemo(() => {
    if (assets.length === 0) return 0;
    return Math.round(assets.reduce((sum, a) => sum + getHealthScore(a), 0) / assets.length);
  }, [assets]);

  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Hardware</h1>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <SummaryCard icon="devices" label="Totaal" value={assets.length} />
        <SummaryCard icon="check_circle" label="Geldig" value={statusCounts.valid} color="text-green-600" />
        <SummaryCard icon="warning" label="Verloopt" value={statusCounts.expiring} color="text-orange-500" />
        <SummaryCard icon="cancel" label="Verlopen" value={statusCounts.expired} color="text-red-600" />
        <SummaryCard icon="monitor_heart" label="Gem. gezondheid" value={`${avgHealth}%`} color={getHealthColor(avgHealth)} />
      </div>

      {/* Upgrade banner */}
      {upgradeCount > 3 && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 shadow-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <MaterialIcon name="system_update_alt" className="text-red-600" size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              {upgradeCount} apparaten hebben een upgrade nodig
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Bekijk de aanbevelingen voor vervangende producten en indicatieprijzen.
            </p>
          </div>
          <Link
            href="/upgrade"
            className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors"
          >
            Bekijk aanbevelingen
          </Link>
        </div>
      )}

      {/* Toolbar: search + group toggle + actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <MaterialIcon
            name="search"
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Zoek op naam, serienummer, gebruiker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Hardware zoeken"
          />
        </div>

        {/* Group by toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(Object.keys(groupByLabels) as GroupBy[]).map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                groupBy === g
                  ? "bg-yielder-navy text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              aria-pressed={groupBy === g}
            >
              {groupByLabels[g]}
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted transition-colors"
            aria-label={selectedIds.size === filteredAssets.length ? "Deselecteer alles" : "Selecteer alles"}
          >
            <MaterialIcon
              name={selectedIds.size === filteredAssets.length && filteredAssets.length > 0 ? "check_box" : "check_box_outline_blank"}
              size={16}
            />
            {selectedIds.size > 0 ? `${selectedIds.size} geselecteerd` : "Selecteer"}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted transition-colors"
            aria-label="Exporteer naar CSV"
          >
            <MaterialIcon name="download" size={16} />
            CSV
          </button>
        </div>
      </div>

      {/* Content */}
      {assets.length === 0 ? (
        <EmptyState icon="devices" message="Geen hardware gevonden" />
      ) : filteredAssets.length === 0 ? (
        <EmptyStateInline
          icon="search_off"
          message="Geen resultaten — pas je zoekopdracht aan"
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="flex items-center gap-2 mb-4">
                <MaterialIcon
                  name={group.icon}
                  className="text-yielder-navy/70"
                  size={20}
                />
                <h2 className="text-sm font-semibold text-foreground">
                  {group.label}
                </h2>
                <span className="text-xs text-muted-foreground">
                  ({group.assets.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.assets.map((asset) => (
                  <HardwareCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedIds.has(asset.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3 shadow-card">
      <MaterialIcon name={icon} size={20} className={color ?? "text-yielder-navy/70"} />
      <div>
        <p className={`text-lg font-bold ${color ?? "text-foreground"}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── Hardware Card ─────────────────────────────────────────────────

function HardwareCard({
  asset,
  isSelected,
  onToggleSelect,
}: {
  asset: HardwareAsset;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const warranty = getWarrantyStatus(asset.warranty_expiry);
  const config = warrantyStatusConfig[warranty];
  const upgradeInfo = getHardwareUpgradeInfo(asset.warranty_expiry, null, null);
  const warrantyText = formatWarrantyText(asset.warranty_expiry);
  const healthScore = getHealthScore(asset);
  const lifecycle = getLifecycleProgress(asset);

  return (
    <HardwareDetailModal
      asset={asset}
      warrantyClassName={config.className}
      warrantyText={warrantyText}
    >
      <Card
        className={`hover:shadow-card-hover transition-shadow relative ${
          upgradeInfo.needsUpgrade ? "ring-1 ring-red-200" : ""
        } ${isSelected ? "ring-2 ring-yielder-navy" : ""}`}
      >
        {/* Select checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(asset.id);
          }}
          className="absolute top-3 right-3 z-10 p-0.5 rounded hover:bg-muted transition-colors"
          aria-label={isSelected ? "Deselecteer" : "Selecteer"}
        >
          <MaterialIcon
            name={isSelected ? "check_box" : "check_box_outline_blank"}
            size={18}
            className={isSelected ? "text-yielder-navy" : "text-muted-foreground/50"}
          />
        </button>

        <CardHeader className="pr-10">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="truncate">{asset.name}</CardTitle>
          </div>
          {(asset.manufacturer || asset.model) && (
            <CardDescription>
              {[asset.manufacturer, asset.model].filter(Boolean).join(" ")}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Health score bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 shrink-0">Gezondheid</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getHealthBgColor(healthScore)}`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <span className={`text-xs font-semibold w-8 text-right ${getHealthColor(healthScore)}`}>
              {healthScore}
            </span>
          </div>

          {/* Lifecycle progress */}
          {lifecycle !== null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Levenscyclus</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getLifecycleColor(lifecycle)}`}
                  style={{ width: `${Math.min(lifecycle, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{lifecycle}%</span>
            </div>
          )}

          {/* Metadata */}
          {asset.serial_number && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MaterialIcon name="tag" size={14} />
              <span className="font-mono">{asset.serial_number}</span>
            </div>
          )}
          {asset.assigned_to && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MaterialIcon name="person" size={14} />
              <span>{asset.assigned_to}</span>
            </div>
          )}

          {/* Warranty + upgrade badges */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Badge className={config.className}>{warrantyText}</Badge>
            {upgradeInfo.needsUpgrade && (
              <Link href="/upgrade" onClick={(e) => e.stopPropagation()}>
                <Badge
                  className={
                    upgradeInfo.severity === "critical"
                      ? "bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer whitespace-nowrap"
                      : "bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer whitespace-nowrap"
                  }
                >
                  <MaterialIcon
                    name={upgradeInfo.severity === "critical" ? "error" : "upgrade"}
                    size={12}
                    className="mr-1"
                  />
                  {upgradeInfo.badgeText}
                </Badge>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </HardwareDetailModal>
  );
}
