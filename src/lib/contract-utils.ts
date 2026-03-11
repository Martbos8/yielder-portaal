import type { Agreement } from "@/types/database";

export type ContractStatus = "expiring_soon" | "active" | "expired" | "cancelled";

export type ContractRecommendation = {
  agreementId: string;
  type: "expiring" | "missing_managed_service";
  badgeText: string;
  severity: "warning" | "info";
};

/**
 * Calculates the number of days remaining until a contract expires.
 * Returns null if no end date is set.
 */
export function daysUntilExpiry(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a contract is expiring within the given number of days.
 */
export function isExpiringSoon(
  endDate: string | null,
  withinDays = 60
): boolean {
  const days = daysUntilExpiry(endDate);
  if (days === null) return false;
  return days > 0 && days <= withinDays;
}

/**
 * Detects if an agreement name suggests it's a managed service.
 */
export function isManagedService(agreement: Pick<Agreement, "name" | "type">): boolean {
  const text = `${agreement.name} ${agreement.type ?? ""}`.toLowerCase();
  return (
    text.includes("managed") ||
    text.includes("beheer") ||
    text.includes("monitoring") ||
    text.includes("patch") ||
    text.includes("helpdesk") ||
    text.includes("support")
  );
}

/**
 * Gets the expiry badge info for a contract that's expiring soon.
 */
export function getExpiryBadge(
  endDate: string | null
): { show: boolean; daysLeft: number; text: string } {
  const days = daysUntilExpiry(endDate);
  if (days === null || days <= 0 || days > 60) {
    return { show: false, daysLeft: 0, text: "" };
  }
  return {
    show: true,
    daysLeft: days,
    text: days <= 7
      ? `Verloopt over ${days} ${days === 1 ? "dag" : "dagen"} — actie vereist`
      : `Verloopt over ${days} dagen`,
  };
}

/**
 * Counts how many agreements are expiring within 60 days.
 */
export function countExpiringSoon(agreements: Agreement[]): number {
  return agreements.filter(
    (a) => a.status === "active" && isExpiringSoon(a.end_date, 60)
  ).length;
}

/**
 * Checks if an agreement set is missing managed services coverage.
 * Returns true if there are active agreements but none are managed services.
 */
export function isMissingManagedCoverage(agreements: Agreement[]): boolean {
  const active = agreements.filter((a) => a.status === "active");
  if (active.length === 0) return false;
  return !active.some((a) => isManagedService(a));
}
