import { getHardwareAssets } from "@/lib/queries";
import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { HardwareAsset, HardwareAssetType } from "@/types/database";
import { getWarrantyStatus, type WarrantyStatus } from "@/lib/hardware-utils";

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

const warrantyConfig: Record<
  WarrantyStatus,
  { className: string; icon: string }
> = {
  valid: {
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: "verified",
  },
  expiring: {
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    icon: "warning",
  },
  expired: {
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: "error",
  },
  unknown: {
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    icon: "help",
  },
};

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

function groupByType(
  assets: HardwareAsset[]
): Record<HardwareAssetType, HardwareAsset[]> {
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
  return groups;
}

export default async function HardwarePage() {
  const assets = await getHardwareAssets();
  const groups = groupByType(assets);
  const hasAssets = assets.length > 0;

  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Hardware</h1>

      {!hasAssets ? (
        <div className="bg-card rounded-2xl p-12 shadow-card border border-border flex flex-col items-center justify-center text-muted-foreground">
          <MaterialIcon
            name="devices"
            className="text-muted-foreground/50 mb-3"
            size={48}
          />
          <p className="text-sm">Geen hardware gevonden</p>
        </div>
      ) : (
        <div className="space-y-8">
          {typeOrder.map((type) => {
            const typeAssets = groups[type];
            if (typeAssets.length === 0) return null;

            return (
              <section key={type}>
                <div className="flex items-center gap-2 mb-4">
                  <MaterialIcon
                    name={typeIcons[type]}
                    className="text-yielder-navy/70"
                    size={20}
                  />
                  <h2 className="text-sm font-semibold text-foreground">
                    {type}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    ({typeAssets.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {typeAssets.map((asset) => {
                    const warranty = getWarrantyStatus(asset.warranty_expiry);
                    const config = warrantyConfig[warranty];

                    return (
                      <Card key={asset.id}>
                        <CardHeader>
                          <CardTitle className="truncate">
                            {asset.name}
                          </CardTitle>
                          {(asset.manufacturer || asset.model) && (
                            <CardDescription>
                              {[asset.manufacturer, asset.model]
                                .filter(Boolean)
                                .join(" ")}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {asset.serial_number && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MaterialIcon
                                name="tag"
                                size={14}
                              />
                              <span className="font-mono">
                                {asset.serial_number}
                              </span>
                            </div>
                          )}
                          {asset.assigned_to && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MaterialIcon
                                name="person"
                                size={14}
                              />
                              <span>{asset.assigned_to}</span>
                            </div>
                          )}
                          <div className="pt-1">
                            <Badge className={config.className}>
                              {formatWarrantyText(asset.warranty_expiry)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
