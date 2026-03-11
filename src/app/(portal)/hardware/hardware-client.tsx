"use client";

import { useCallback, useMemo, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounce";
import Link from "next/link";
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
import {
  StatCardCompact,
  EmptyState,
  EmptyStateInline,
  warrantyStatusConfig,
} from "@/components/data-display";
import { HardwareDetailModal } from "@/components/hardware-detail-modal";
import {
  getWarrantyStatus,
  getHardwareUpgradeInfo,
  countAssetsNeedingUpgrade,
} from "@/lib/hardware-utils";
import type { HardwareAsset, HardwareAssetType } from "@/types/database";
import type { WarrantyStatus } from "@/lib/hardware-utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type GroupMode = "type" | "status" | "assigned";

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

const statusLabels: Record<WarrantyStatus, string> = {
  valid: "Geldig",
  expiring: "Verloopt binnenkort",
  expired: "Verlopen",
  unknown: "Onbekend",
};

const statusOrder: WarrantyStatus[] = ["expired", "expiring", "valid", "unknown"];

const statusIcons: Record<WarrantyStatus, string> = {
  valid: "verified",
  expiring: "schedule",
  expired: "warning",
  unknown: "help_outline",
};

const groupModeLabels: Record<GroupMode, { label: string; icon: string }> = {
  type: { label: "Type", icon: "category" },
  status: { label: "Status", icon: "shield" },
  assigned: { label: "Toegewezen aan", icon: "person" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Compute a simple health score (0-100) for a hardware asset based on warranty status. */
function computeHealthScore(asset: HardwareAsset): number {
  const warranty = getWarrantyStatus(asset.warranty_expiry);
  if (warranty === "expired") return 20;
  if (warranty === "expiring") return 55;
  if (warranty === "unknown") return 50;

  // Valid warranty — score based on how far until expiry
  if (asset.warranty_expiry) {
    const now = Date.now();
    const expiry = new Date(asset.warranty_expiry).getTime();
    const remainingMonths = (expiry - now) / (1000 * 60 * 60 * 24 * 30);
    if (remainingMonths > 24) return 95;
    if (remainingMonths > 12) return 85;
    return 70;
  }
  return 50;
}

/** Get color class for health score. */
function healthColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

function healthBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

/** Lifecycle progress bar: 0-100% based on warranty timeline. */
function LifecycleBar({ asset }: { asset: HardwareAsset }) {
  if (!asset.warranty_expiry) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex-1 h-1.5 rounded-full bg-muted" />
        <span>Onbekend</span>
      </div>
    );
  }

  const created = new Date(asset.created_at).getTime();
  const expiry = new Date(asset.warranty_expiry).getTime();
  const now = Date.now();

  const totalSpan = expiry - created;
  const elapsed = now - created;
  const progress = totalSpan > 0 ? Math.min(100, Math.max(0, (elapsed / totalSpan) * 100)) : 100;
  const isPastExpiry = now > expiry;

  const barColor = isPastExpiry
    ? "bg-red-500"
    : progress > 75
      ? "bg-orange-500"
      : "bg-emerald-500";

  const remaining = expiry - now;
  const remainingDays = Math.ceil(remaining / (1000 * 60 * 60 * 24));

  let label: string;
  if (isPastExpiry) {
    const daysAgo = Math.abs(remainingDays);
    label = `${daysAgo} dagen verlopen`;
  } else if (remainingDays > 365) {
    const years = Math.floor(remainingDays / 365);
    label = `Nog ${years}+ jaar`;
  } else if (remainingDays > 30) {
    const months = Math.floor(remainingDays / 30);
    label = `Nog ${months} mnd`;
  } else {
    label = `Nog ${remainingDays} dgn`;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium whitespace-nowrap ${isPastExpiry ? "text-red-600" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}

/** Convert assets to CSV string. */
function toCSV(assets: HardwareAsset[]): string {
  const headers = ["Naam", "Type", "Fabrikant", "Model", "Serienummer", "Toegewezen aan", "Garantie t/m", "Health score"];
  const rows = assets.map((a) => [
    a.name,
    a.type,
    a.manufacturer ?? "",
    a.model ?? "",
    a.serial_number ?? "",
    a.assigned_to ?? "",
    a.warranty_expiry ?? "",
    String(computeHealthScore(a)),
  ]);
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Grouping logic
// ---------------------------------------------------------------------------

interface GroupInfo {
  key: string;
  label: string;
  icon: string;
  assets: HardwareAsset[];
}

function groupAssets(assets: HardwareAsset[], mode: GroupMode): GroupInfo[] {
  if (mode === "type") {
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
      .map((t) => ({ key: t, label: t, icon: typeIcons[t], assets: groups[t] }));
  }

  if (mode === "status") {
    const groups: Record<WarrantyStatus, HardwareAsset[]> = {
      valid: [],
      expiring: [],
      expired: [],
      unknown: [],
    };
    for (const asset of assets) {
      const status = getWarrantyStatus(asset.warranty_expiry);
      groups[status].push(asset);
    }
    return statusOrder
      .filter((s) => groups[s].length > 0)
      .map((s) => ({ key: s, label: statusLabels[s], icon: statusIcons[s], assets: groups[s] }));
  }

  // Grouped by assigned_to
  const map = new Map<string, HardwareAsset[]>();
  const unassigned: HardwareAsset[] = [];
  for (const asset of assets) {
    if (asset.assigned_to) {
      const existing = map.get(asset.assigned_to);
      if (existing) {
        existing.push(asset);
      } else {
        map.set(asset.assigned_to, [asset]);
      }
    } else {
      unassigned.push(asset);
    }
  }
  const result: GroupInfo[] = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, "nl-NL"))
    .map(([name, items]) => ({ key: name, label: name, icon: "person", assets: items }));
  if (unassigned.length > 0) {
    result.push({ key: "_unassigned", label: "Niet toegewezen", icon: "person_off", assets: unassigned });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface HardwareClientProps {
  assets: HardwareAsset[];
}

export function HardwareClient({ assets }: HardwareClientProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [groupMode, setGroupMode] = useState<GroupMode>("type");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const upgradeCount = useMemo(() => countAssetsNeedingUpgrade(assets), [assets]);

  // Filter by search (debounced for performance)
  const filtered = useMemo(() => {
    if (!debouncedSearch) return assets;
    const q = debouncedSearch.toLowerCase();
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.serial_number?.toLowerCase().includes(q) ?? false) ||
        (a.assigned_to?.toLowerCase().includes(q) ?? false) ||
        (a.manufacturer?.toLowerCase().includes(q) ?? false) ||
        (a.model?.toLowerCase().includes(q) ?? false)
    );
  }, [assets, debouncedSearch]);

  // Group filtered assets
  const groups = useMemo(() => groupAssets(filtered, groupMode), [filtered, groupMode]);

  // Memoize health scores per asset (expensive computation)
  const healthScores = useMemo(() => {
    const map = new Map<string, number>();
    for (const asset of assets) {
      map.set(asset.id, computeHealthScore(asset));
    }
    return map;
  }, [assets]);

  // Summary stats
  const stats = useMemo(() => {
    const total = assets.length;
    const expired = assets.filter((a) => getWarrantyStatus(a.warranty_expiry) === "expired").length;
    const expiring = assets.filter((a) => getWarrantyStatus(a.warranty_expiry) === "expiring").length;
    const avgHealth = total > 0 ? Math.round(assets.reduce((sum, a) => sum + (healthScores.get(a.id) ?? 0), 0) / total) : 0;
    return { total, expired, expiring, avgHealth };
  }, [assets, healthScores]);

  // Selection handlers
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
    setSelectedIds((prev) => {
      if (prev.size === filtered.length) return new Set();
      return new Set(filtered.map((a) => a.id));
    });
  }, [filtered]);

  const handleExportCSV = useCallback(() => {
    const toExport = selectedIds.size > 0
      ? filtered.filter((a) => selectedIds.has(a.id))
      : filtered;
    const csv = toCSV(toExport);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(csv, `hardware-export-${date}.csv`);
  }, [filtered, selectedIds]);

  if (assets.length === 0) {
    return <EmptyState icon="devices" message="Geen hardware gevonden" />;
  }

  const allSelected = selectedIds.size === filtered.length && filtered.length > 0;

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCardCompact label="Totaal" value={String(stats.total)} icon="devices" />
        <StatCardCompact label="Verlopen garantie" value={String(stats.expired)} icon="warning" />
        <StatCardCompact label="Binnenkort verlopen" value={String(stats.expiring)} icon="schedule" />
        <StatCardCompact label="Gem. health" value={`${stats.avgHealth}%`} icon="monitor_heart" />
      </div>

      {/* Upgrade banner */}
      {upgradeCount > 0 && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 shadow-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <MaterialIcon name="system_update_alt" className="text-red-600" size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              {upgradeCount} {upgradeCount === 1 ? "apparaat heeft" : "apparaten hebben"} een upgrade nodig
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

      {/* Toolbar: search + group toggle + bulk actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <MaterialIcon
            name="search"
            size={18}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Zoek op naam, serienummer, gebruiker…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Hardware zoeken"
          />
        </div>

        {/* Group mode toggle */}
        <div className="flex rounded-lg border border-input overflow-hidden shrink-0">
          {(Object.keys(groupModeLabels) as GroupMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setGroupMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                groupMode === mode
                  ? "bg-yielder-navy text-white"
                  : "bg-transparent text-muted-foreground hover:bg-muted"
              }`}
              aria-label={`Groepeer op ${groupModeLabels[mode].label}`}
              aria-pressed={groupMode === mode}
            >
              <MaterialIcon name={groupModeLabels[mode].icon} size={14} />
              {groupModeLabels[mode].label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions bar */}
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="rounded border-input accent-yielder-navy"
            aria-label="Alles selecteren"
          />
          {selectedIds.size > 0
            ? `${selectedIds.size} geselecteerd`
            : "Alles selecteren"}
        </label>
        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Exporteer naar CSV"
        >
          <MaterialIcon name="download" size={14} />
          Exporteer CSV{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
        </button>
        {search && (
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} van {assets.length} resultaten
          </span>
        )}
      </div>

      {/* No results after filtering */}
      {filtered.length === 0 && (
        <EmptyStateInline
          icon="filter_list_off"
          message="Geen hardware gevonden voor deze zoekopdracht"
        />
      )}

      {/* Grouped hardware cards */}
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.key}>
            <div className="flex items-center gap-2 mb-4">
              <MaterialIcon name={group.icon} className="text-yielder-navy/70" size={20} />
              <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
              <span className="text-xs text-muted-foreground">({group.assets.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.assets.map((asset) => {
                const warranty = getWarrantyStatus(asset.warranty_expiry);
                const config = warrantyStatusConfig[warranty];
                const upgradeInfo = getHardwareUpgradeInfo(asset.warranty_expiry, null, null);
                const warrantyText = formatWarrantyText(asset.warranty_expiry);
                const health = healthScores.get(asset.id) ?? computeHealthScore(asset);
                const isSelected = selectedIds.has(asset.id);

                return (
                  <div key={asset.id} className="relative">
                    {/* Selection checkbox */}
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(asset.id)}
                        className="rounded border-input accent-yielder-navy cursor-pointer"
                        aria-label={`Selecteer ${asset.name}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <HardwareDetailModal
                      asset={asset}
                      warrantyClassName={config.className}
                      warrantyText={warrantyText}
                    >
                      <Card
                        className={`hover:shadow-card-hover transition-all pl-8 ${
                          upgradeInfo.needsUpgrade ? "ring-1 ring-red-200" : ""
                        } ${isSelected ? "ring-2 ring-yielder-navy/40 bg-yielder-navy/[0.02]" : ""}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="truncate text-sm">{asset.name}</CardTitle>
                              {(asset.manufacturer || asset.model) && (
                                <CardDescription className="text-xs">
                                  {[asset.manufacturer, asset.model].filter(Boolean).join(" ")}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Health score indicator */}
                              <div className={`flex items-center gap-1 ${healthColor(health)}`} title={`Health: ${health}%`}>
                                <MaterialIcon name="monitor_heart" size={14} />
                                <span className="text-xs font-semibold">{health}</span>
                              </div>
                              {upgradeInfo.needsUpgrade && (
                                <Link href="/upgrade" className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <Badge
                                    className={
                                      upgradeInfo.severity === "critical"
                                        ? "bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer whitespace-nowrap text-[10px]"
                                        : "bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer whitespace-nowrap text-[10px]"
                                    }
                                  >
                                    <MaterialIcon
                                      name={upgradeInfo.severity === "critical" ? "error" : "upgrade"}
                                      size={10}
                                      className="mr-0.5"
                                    />
                                    Vervangingsadvies
                                  </Badge>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                          {/* Lifecycle progress bar */}
                          <LifecycleBar asset={asset} />

                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {asset.serial_number && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MaterialIcon name="tag" size={12} />
                                <span className="font-mono text-[11px]">{asset.serial_number}</span>
                              </div>
                            )}
                            {asset.assigned_to && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MaterialIcon name="person" size={12} />
                                <span>{asset.assigned_to}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <Badge className={`${config.className} text-[10px]`}>{warrantyText}</Badge>
                            {/* Health bar */}
                            <div className="flex items-center gap-1.5" title={`Health score: ${health}%`}>
                              <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${healthBgColor(health)}`}
                                  style={{ width: `${health}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </HardwareDetailModal>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
