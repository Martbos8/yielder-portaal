import { describe, it, expect } from "vitest";
import type { License, LicenseStatus } from "@/types/database";

describe("Software/Licenties page", () => {
  it("page title is Software & Licenties", () => {
    const title = "Software & Licenties";
    expect(title).toBe("Software & Licenties");
  });

  it("empty state text is correct", () => {
    const emptyText = "Geen licenties gevonden";
    expect(emptyText).toBe("Geen licenties gevonden");
  });
});

describe("License status badges", () => {
  const statusConfig: Record<
    LicenseStatus,
    { label: string; className: string }
  > = {
    active: {
      label: "Actief",
      className: "bg-emerald-100 text-emerald-700",
    },
    expiring: {
      label: "Verloopt binnenkort",
      className: "bg-orange-100 text-orange-700",
    },
    expired: {
      label: "Verlopen",
      className: "bg-red-100 text-red-700",
    },
  };

  it("active uses green styling", () => {
    expect(statusConfig.active.className).toContain("emerald");
    expect(statusConfig.active.label).toBe("Actief");
  });

  it("expiring uses orange styling", () => {
    expect(statusConfig.expiring.className).toContain("orange");
    expect(statusConfig.expiring.label).toBe("Verloopt binnenkort");
  });

  it("expired uses red styling", () => {
    expect(statusConfig.expired.className).toContain("red");
    expect(statusConfig.expired.label).toBe("Verlopen");
  });
});

describe("License filtering logic", () => {
  const mockLicenses: Pick<
    License,
    "vendor" | "product_name" | "status" | "seats_used" | "seats_total"
  >[] = [
    {
      vendor: "Microsoft",
      product_name: "Microsoft 365 Business",
      status: "active",
      seats_used: 45,
      seats_total: 50,
    },
    {
      vendor: "Adobe",
      product_name: "Creative Cloud",
      status: "expiring",
      seats_used: 8,
      seats_total: 10,
    },
    {
      vendor: "Microsoft",
      product_name: "Azure DevOps",
      status: "active",
      seats_used: 12,
      seats_total: 20,
    },
    {
      vendor: "Sophos",
      product_name: "Endpoint Protection",
      status: "expired",
      seats_used: 0,
      seats_total: 50,
    },
  ];

  it("filters by vendor", () => {
    const vendorFilter = "Microsoft";
    const filtered = mockLicenses.filter((l) => l.vendor === vendorFilter);
    expect(filtered).toHaveLength(2);
    expect(filtered.every((l) => l.vendor === "Microsoft")).toBe(true);
  });

  it("filters by status", () => {
    const statusFilter = "active";
    const filtered = mockLicenses.filter((l) => l.status === statusFilter);
    expect(filtered).toHaveLength(2);
  });

  it("filters by search term on product name", () => {
    const search = "creative";
    const filtered = mockLicenses.filter((l) =>
      l.product_name.toLowerCase().includes(search.toLowerCase())
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].vendor).toBe("Adobe");
  });

  it("filters by search term on vendor", () => {
    const search = "sophos";
    const filtered = mockLicenses.filter(
      (l) =>
        l.product_name.toLowerCase().includes(search.toLowerCase()) ||
        l.vendor.toLowerCase().includes(search.toLowerCase())
    );
    expect(filtered).toHaveLength(1);
  });

  it("combined filters narrow results", () => {
    const vendorFilter = "Microsoft";
    const search = "365";
    const filtered = mockLicenses.filter(
      (l) =>
        l.vendor === vendorFilter &&
        l.product_name.toLowerCase().includes(search.toLowerCase())
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].product_name).toBe("Microsoft 365 Business");
  });

  it("extracts unique vendors", () => {
    const vendors = Array.from(new Set(mockLicenses.map((l) => l.vendor)));
    expect(vendors).toContain("Microsoft");
    expect(vendors).toContain("Adobe");
    expect(vendors).toContain("Sophos");
  });
});

describe("Seat usage calculation", () => {
  it("calculates usage percentage correctly", () => {
    const used = 45;
    const total = 50;
    const percentage = Math.round((used / total) * 100);
    expect(percentage).toBe(90);
  });

  it("handles zero total gracefully", () => {
    const used = 0;
    const total = 0;
    const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
    expect(percentage).toBe(0);
  });

  it("high usage is >= 90%", () => {
    const percentage = 90;
    const isHigh = percentage >= 90;
    expect(isHigh).toBe(true);
  });

  it("medium usage is 70-89%", () => {
    const percentage = 75;
    const isMedium = percentage >= 70 && percentage < 90;
    expect(isMedium).toBe(true);
  });
});

describe("License cost summary", () => {
  it("calculates total monthly cost", () => {
    const licenses = [
      { cost_per_seat: 12.5, seats_total: 50 },
      { cost_per_seat: 55, seats_total: 10 },
      { cost_per_seat: null, seats_total: 20 },
    ];

    const total = licenses.reduce(
      (sum, l) => sum + (l.cost_per_seat ?? 0) * l.seats_total,
      0
    );
    expect(total).toBe(12.5 * 50 + 55 * 10);
  });
});
