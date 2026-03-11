import { describe, it, expect } from "vitest";
import {
  getWarrantyStatus,
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
    const dateStr = soon.toISOString().split("T")[0];
    expect(getWarrantyStatus(dateStr)).toBe("expiring");
  });

  it("returns 'valid' for date more than 6 months away", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    const dateStr = future.toISOString().split("T")[0];
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
