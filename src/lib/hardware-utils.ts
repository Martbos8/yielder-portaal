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
