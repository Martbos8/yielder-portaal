export type WarrantyStatus = "valid" | "expiring" | "expired" | "unknown";

export function getWarrantyStatus(warrantyExpiry: string | null): WarrantyStatus {
  if (!warrantyExpiry) return "unknown";
  const now = new Date();
  const expiry = new Date(warrantyExpiry);
  const diffMs = expiry.getTime() - now.getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);

  if (diffMonths < 0) return "expired";
  if (diffMonths <= 6) return "expiring";
  return "valid";
}

export type UpgradeReason = "warranty_expired" | "warranty_expiring" | "lifecycle_exceeded" | null;

export type HardwareUpgradeInfo = {
  needsUpgrade: boolean;
  reason: UpgradeReason;
  badgeText: string | null;
  severity: "critical" | "warning" | null;
};

/**
 * Determines if a hardware asset needs an upgrade based on warranty status
 * and optionally its age vs lifecycle_years.
 */
export function getHardwareUpgradeInfo(
  warrantyExpiry: string | null,
  purchaseDate: string | null,
  lifecycleYears: number | null
): HardwareUpgradeInfo {
  const warrantyStatus = getWarrantyStatus(warrantyExpiry);

  // Critical: warranty expired
  if (warrantyStatus === "expired") {
    return {
      needsUpgrade: true,
      reason: "warranty_expired",
      badgeText: "Warranty verlopen — actie vereist",
      severity: "critical",
    };
  }

  // Warning: warranty expiring soon
  if (warrantyStatus === "expiring") {
    return {
      needsUpgrade: true,
      reason: "warranty_expiring",
      badgeText: "Upgrade beschikbaar",
      severity: "warning",
    };
  }

  // Warning: device older than lifecycle
  if (purchaseDate && lifecycleYears) {
    const purchased = new Date(purchaseDate);
    const now = new Date();
    const ageYears = (now.getTime() - purchased.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (ageYears >= lifecycleYears) {
      return {
        needsUpgrade: true,
        reason: "lifecycle_exceeded",
        badgeText: "Upgrade beschikbaar",
        severity: "warning",
      };
    }
  }

  return { needsUpgrade: false, reason: null, badgeText: null, severity: null };
}

/**
 * Counts how many assets in a list need upgrades.
 */
export function countAssetsNeedingUpgrade(
  assets: Array<{ warranty_expiry: string | null }>
): number {
  return assets.filter(
    (a) => getWarrantyStatus(a.warranty_expiry) === "expired" || getWarrantyStatus(a.warranty_expiry) === "expiring"
  ).length;
}
