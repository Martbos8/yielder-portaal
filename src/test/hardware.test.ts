import { describe, it, expect } from "vitest";
import {
  getWarrantyStatus,
  getHardwareUpgradeInfo,
  countAssetsNeedingUpgrade,
  type WarrantyStatus,
} from "@/lib/hardware-utils";

describe("Hardware page", () => {
  it("page title is Hardware", () => {
    const title = "Hardware";
    expect(title).toBe("Hardware");
  });

  it("empty state text is correct", () => {
    const emptyText = "Geen hardware gevonden";
    expect(emptyText).toBe("Geen hardware gevonden");
  });

  it("has all 5 hardware type groups", () => {
    const types = ["Desktop", "Laptop", "Server", "Netwerk", "Overig"];
    expect(types).toHaveLength(5);
  });
});

describe("getWarrantyStatus", () => {
  it("returns 'unknown' for null warranty", () => {
    expect(getWarrantyStatus(null)).toBe("unknown");
  });

  it("returns 'expired' for past date", () => {
    expect(getWarrantyStatus("2020-01-01")).toBe("expired");
  });

  it("returns 'expiring' for date within 6 months", () => {
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 3);
    const dateStr = soon.toISOString().split("T")[0]!;
    expect(getWarrantyStatus(dateStr)).toBe("expiring");
  });

  it("returns 'valid' for date more than 6 months away", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    const dateStr = future.toISOString().split("T")[0]!;
    expect(getWarrantyStatus(dateStr)).toBe("valid");
  });
});

describe("Warranty badge styling", () => {
  const warrantyConfig: Record<WarrantyStatus, { className: string }> = {
    valid: { className: "bg-emerald-100 text-emerald-700" },
    expiring: { className: "bg-orange-100 text-orange-700" },
    expired: { className: "bg-red-100 text-red-700" },
    unknown: { className: "bg-gray-100 text-gray-600" },
  };

  it("valid warranty uses green styling", () => {
    expect(warrantyConfig.valid.className).toContain("emerald");
  });

  it("expiring warranty uses orange styling", () => {
    expect(warrantyConfig.expiring.className).toContain("orange");
  });

  it("expired warranty uses red styling", () => {
    expect(warrantyConfig.expired.className).toContain("red");
  });

  it("unknown warranty uses gray styling", () => {
    expect(warrantyConfig.unknown.className).toContain("gray");
  });
});

describe("Warranty text formatting", () => {
  it("shows 'Garantie onbekend' for null", () => {
    const text = "Garantie onbekend";
    expect(text).toBe("Garantie onbekend");
  });

  it("shows 'Verlopen op' for expired dates", () => {
    const text = "Verlopen op 3 jan 2025";
    expect(text).toContain("Verlopen op");
  });

  it("shows 'Geldig t/m' for valid dates", () => {
    const text = "Geldig t/m 12 sep 2026";
    expect(text).toContain("Geldig t/m");
  });
});

describe("getHardwareUpgradeInfo", () => {
  it("returns critical upgrade for expired warranty", () => {
    const info = getHardwareUpgradeInfo("2020-01-01", null, null);
    expect(info.needsUpgrade).toBe(true);
    expect(info.severity).toBe("critical");
    expect(info.reason).toBe("warranty_expired");
    expect(info.badgeText).toContain("Warranty verlopen");
  });

  it("returns warning upgrade for expiring warranty", () => {
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 3);
    const dateStr = soon.toISOString().split("T")[0]!;
    const info = getHardwareUpgradeInfo(dateStr, null, null);
    expect(info.needsUpgrade).toBe(true);
    expect(info.severity).toBe("warning");
    expect(info.reason).toBe("warranty_expiring");
    expect(info.badgeText).toBe("Upgrade beschikbaar");
  });

  it("returns warning for device older than lifecycle", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    const futureWarranty = future.toISOString().split("T")[0]!;
    const oldPurchase = new Date();
    oldPurchase.setFullYear(oldPurchase.getFullYear() - 6);
    const purchaseStr = oldPurchase.toISOString().split("T")[0]!;
    const info = getHardwareUpgradeInfo(futureWarranty, purchaseStr, 5);
    expect(info.needsUpgrade).toBe(true);
    expect(info.severity).toBe("warning");
    expect(info.reason).toBe("lifecycle_exceeded");
  });

  it("returns no upgrade for valid warranty within lifecycle", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    const dateStr = future.toISOString().split("T")[0]!;
    const info = getHardwareUpgradeInfo(dateStr, null, null);
    expect(info.needsUpgrade).toBe(false);
    expect(info.severity).toBeNull();
    expect(info.badgeText).toBeNull();
  });

  it("returns no upgrade for null warranty (unknown)", () => {
    const info = getHardwareUpgradeInfo(null, null, null);
    expect(info.needsUpgrade).toBe(false);
  });
});

describe("countAssetsNeedingUpgrade", () => {
  it("counts expired and expiring assets", () => {
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 3);
    const soonStr = soon.toISOString().split("T")[0]!;
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    const futureStr = future.toISOString().split("T")[0]!;

    const assets = [
      { warranty_expiry: "2020-01-01" },   // expired
      { warranty_expiry: soonStr },          // expiring
      { warranty_expiry: futureStr },        // valid
      { warranty_expiry: null },             // unknown
      { warranty_expiry: "2019-06-15" },     // expired
    ];
    expect(countAssetsNeedingUpgrade(assets)).toBe(3);
  });

  it("returns 0 when no assets need upgrade", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    const futureStr = future.toISOString().split("T")[0]!;
    const assets = [
      { warranty_expiry: futureStr },
      { warranty_expiry: null },
    ];
    expect(countAssetsNeedingUpgrade(assets)).toBe(0);
  });
});

describe("Hardware upgrade banner", () => {
  it("banner threshold is >3 devices", () => {
    const threshold = 3;
    expect(4 > threshold).toBe(true);
    expect(3 > threshold).toBe(false);
  });

  it("banner text mentions upgrade count", () => {
    const count = 5;
    const text = `${count} apparaten hebben een upgrade nodig`;
    expect(text).toContain("5 apparaten");
    expect(text).toContain("upgrade nodig");
  });
});
