import { describe, it, expect } from "vitest";
import {
  getWarrantyStatus,
  getHardwareUpgradeInfo,
  countAssetsNeedingUpgrade,
} from "@/lib/hardware-utils";

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

function yearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split("T")[0]!;
}

describe("hardware-utils", () => {
  describe("getWarrantyStatus", () => {
    it("returns 'unknown' for null warranty", () => {
      expect(getWarrantyStatus(null)).toBe("unknown");
    });

    it("returns 'expired' for past dates", () => {
      expect(getWarrantyStatus(daysFromNow(-30))).toBe("expired");
    });

    it("returns 'expiring' for dates within 6 months", () => {
      expect(getWarrantyStatus(daysFromNow(90))).toBe("expiring");
    });

    it("returns 'valid' for dates beyond 6 months", () => {
      expect(getWarrantyStatus(daysFromNow(365))).toBe("valid");
    });
  });

  describe("getHardwareUpgradeInfo", () => {
    it("returns critical when warranty is expired", () => {
      const result = getHardwareUpgradeInfo(daysFromNow(-30), null, null);
      expect(result.needsUpgrade).toBe(true);
      expect(result.reason).toBe("warranty_expired");
      expect(result.severity).toBe("critical");
      expect(result.badgeText).toContain("verlopen");
    });

    it("returns warning when warranty is expiring", () => {
      const result = getHardwareUpgradeInfo(daysFromNow(90), null, null);
      expect(result.needsUpgrade).toBe(true);
      expect(result.reason).toBe("warranty_expiring");
      expect(result.severity).toBe("warning");
    });

    it("returns warning when lifecycle is exceeded", () => {
      const result = getHardwareUpgradeInfo(daysFromNow(365), yearsAgo(6), 5);
      expect(result.needsUpgrade).toBe(true);
      expect(result.reason).toBe("lifecycle_exceeded");
      expect(result.severity).toBe("warning");
    });

    it("returns no upgrade needed when all is valid", () => {
      const result = getHardwareUpgradeInfo(daysFromNow(365), yearsAgo(2), 5);
      expect(result.needsUpgrade).toBe(false);
      expect(result.reason).toBeNull();
      expect(result.severity).toBeNull();
      expect(result.badgeText).toBeNull();
    });

    it("returns no upgrade needed for unknown warranty with no lifecycle data", () => {
      const result = getHardwareUpgradeInfo(null, null, null);
      expect(result.needsUpgrade).toBe(false);
    });

    it("prioritizes warranty expired over lifecycle exceeded", () => {
      const result = getHardwareUpgradeInfo(daysFromNow(-10), yearsAgo(6), 5);
      expect(result.reason).toBe("warranty_expired");
      expect(result.severity).toBe("critical");
    });

    it("handles missing purchaseDate with lifecycleYears", () => {
      const result = getHardwareUpgradeInfo(daysFromNow(365), null, 5);
      expect(result.needsUpgrade).toBe(false);
    });
  });

  describe("countAssetsNeedingUpgrade", () => {
    it("returns 0 for empty array", () => {
      expect(countAssetsNeedingUpgrade([])).toBe(0);
    });

    it("counts expired and expiring assets", () => {
      const assets = [
        { warranty_expiry: daysFromNow(-30) },  // expired
        { warranty_expiry: daysFromNow(90) },    // expiring
        { warranty_expiry: daysFromNow(365) },   // valid
        { warranty_expiry: null },               // unknown
      ];
      expect(countAssetsNeedingUpgrade(assets)).toBe(2);
    });

    it("returns 0 when all assets are valid", () => {
      const assets = [
        { warranty_expiry: daysFromNow(365) },
        { warranty_expiry: daysFromNow(730) },
      ];
      expect(countAssetsNeedingUpgrade(assets)).toBe(0);
    });
  });
});
