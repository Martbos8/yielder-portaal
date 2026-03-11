import { describe, it, expect } from "vitest";
import {
  computePatterns,
  getCompanySize,
} from "@/lib/engine/pattern-matching";
import type { Company, Product, ClientProduct } from "@/types/database";

function mockCompany(
  overrides: Partial<Company> & { id: string; name: string }
): Company {
  return {
    cw_company_id: null,
    employee_count: null,
    industry: null,
    region: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  };
}

function mockProduct(
  overrides: Partial<Product> & { id: string; name: string }
): Product {
  return {
    category_id: "cat-1",
    vendor: null,
    sku: null,
    description: null,
    type: "software",
    lifecycle_years: null,
    is_active: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  };
}

function mockClientProduct(
  companyId: string,
  productId: string
): ClientProduct {
  return {
    id: `cp-${companyId}-${productId}`,
    company_id: companyId,
    product_id: productId,
    quantity: 1,
    purchase_date: null,
    expiry_date: null,
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
}

describe("Pattern Matching Engine", () => {
  const m365 = mockProduct({ id: "p-m365", name: "Microsoft 365" });
  const backup = mockProduct({ id: "p-backup", name: "Cloud Backup" });
  const firewall = mockProduct({ id: "p-fw", name: "FortiGate Firewall" });
  const allProducts = [m365, backup, firewall];

  // Target company: small IT company without backup
  const target = mockCompany({
    id: "comp-target",
    name: "Target BV",
    employee_count: 10,
    industry: "IT",
  });

  // 5 similar small IT companies
  const peers = Array.from({ length: 5 }, (_, i) =>
    mockCompany({
      id: `comp-peer-${i}`,
      name: `Peer ${i} BV`,
      employee_count: 15,
      industry: "IT",
    })
  );

  const allCompanies = [target, ...peers];

  it("finds popular product that target company is missing", () => {
    // Target has M365 only
    // All 5 peers have M365 + backup (100% adoption for backup)
    const clientProducts = [
      mockClientProduct("comp-target", "p-m365"),
      ...peers.flatMap((p) => [
        mockClientProduct(p.id, "p-m365"),
        mockClientProduct(p.id, "p-backup"),
      ]),
    ];

    const results = computePatterns(
      target,
      allCompanies,
      clientProducts,
      allProducts
    );

    expect(results.length).toBe(1);
    expect(results[0].product.id).toBe("p-backup");
    expect(results[0].adoptionRate).toBe(1);
    expect(results[0].segmentDescription).toContain("100%");
    expect(results[0].segmentDescription).toContain("Cloud Backup");
  });

  it("filters out products below 60% adoption threshold", () => {
    // Only 2 of 5 peers have backup (40%)
    const clientProducts = [
      mockClientProduct("comp-target", "p-m365"),
      ...peers.map((p) => mockClientProduct(p.id, "p-m365")),
      mockClientProduct("comp-peer-0", "p-backup"),
      mockClientProduct("comp-peer-1", "p-backup"),
    ];

    const results = computePatterns(
      target,
      allCompanies,
      clientProducts,
      allProducts
    );

    expect(results.length).toBe(0);
  });

  it("does not suggest products the company already owns", () => {
    // Target already has backup, all peers also have it
    const clientProducts = [
      mockClientProduct("comp-target", "p-m365"),
      mockClientProduct("comp-target", "p-backup"),
      ...peers.flatMap((p) => [
        mockClientProduct(p.id, "p-m365"),
        mockClientProduct(p.id, "p-backup"),
      ]),
    ];

    const results = computePatterns(
      target,
      allCompanies,
      clientProducts,
      allProducts
    );

    expect(results.length).toBe(0);
  });

  it("sorts by adoption rate descending", () => {
    // 5/5 peers have backup (100%), 4/5 peers have firewall (80%)
    const clientProducts = [
      mockClientProduct("comp-target", "p-m365"),
      ...peers.flatMap((p) => [
        mockClientProduct(p.id, "p-m365"),
        mockClientProduct(p.id, "p-backup"),
      ]),
      mockClientProduct("comp-peer-0", "p-fw"),
      mockClientProduct("comp-peer-1", "p-fw"),
      mockClientProduct("comp-peer-2", "p-fw"),
      mockClientProduct("comp-peer-3", "p-fw"),
    ];

    const results = computePatterns(
      target,
      allCompanies,
      clientProducts,
      allProducts
    );

    expect(results.length).toBe(2);
    expect(results[0].product.id).toBe("p-backup");
    expect(results[0].adoptionRate).toBe(1);
    expect(results[1].product.id).toBe("p-fw");
    expect(results[1].adoptionRate).toBe(0.8);
  });

  it("segments by company size — large companies are separate", () => {
    // Target is small (10 employees)
    // Peers are large (200 employees) — different segment
    const largePeers = peers.map((p) => ({
      ...p,
      employee_count: 200,
    }));

    const clientProducts = [
      mockClientProduct("comp-target", "p-m365"),
      ...largePeers.flatMap((p) => [
        mockClientProduct(p.id, "p-m365"),
        mockClientProduct(p.id, "p-backup"),
      ]),
    ];

    const results = computePatterns(
      target,
      [target, ...largePeers],
      clientProducts,
      allProducts
    );

    // No peers in same segment → no patterns
    expect(results.length).toBe(0);
  });

  it("segments by industry when both have an industry set", () => {
    // Target is IT, peers are Healthcare — different segment
    const healthcarePeers = peers.map((p) => ({
      ...p,
      industry: "Healthcare",
    }));

    const clientProducts = [
      mockClientProduct("comp-target", "p-m365"),
      ...healthcarePeers.flatMap((p) => [
        mockClientProduct(p.id, "p-m365"),
        mockClientProduct(p.id, "p-backup"),
      ]),
    ];

    const results = computePatterns(
      target,
      [target, ...healthcarePeers],
      clientProducts,
      allProducts
    );

    expect(results.length).toBe(0);
  });

  it("returns empty when no peer companies exist", () => {
    const clientProducts = [mockClientProduct("comp-target", "p-m365")];

    const results = computePatterns(
      target,
      [target],
      clientProducts,
      allProducts
    );

    expect(results.length).toBe(0);
  });

  it("includes industry in segment description when available", () => {
    const clientProducts = [
      mockClientProduct("comp-target", "p-m365"),
      ...peers.flatMap((p) => [
        mockClientProduct(p.id, "p-m365"),
        mockClientProduct(p.id, "p-backup"),
      ]),
    ];

    const results = computePatterns(
      target,
      allCompanies,
      clientProducts,
      allProducts
    );

    expect(results[0].segmentDescription).toContain("IT-sector");
    expect(results[0].segmentDescription).toContain("kleine");
  });

  it("findPatterns function is exportable", async () => {
    const mod = await import("@/lib/engine/pattern-matching");
    expect(typeof mod.findPatterns).toBe("function");
    expect(typeof mod.computePatterns).toBe("function");
    expect(typeof mod.getCompanySize).toBe("function");
  });
});

describe("getCompanySize", () => {
  it("returns small for null employee count", () => {
    expect(getCompanySize(null)).toBe("small");
  });

  it("returns small for < 20 employees", () => {
    expect(getCompanySize(5)).toBe("small");
    expect(getCompanySize(19)).toBe("small");
  });

  it("returns medium for 20-100 employees", () => {
    expect(getCompanySize(20)).toBe("medium");
    expect(getCompanySize(50)).toBe("medium");
    expect(getCompanySize(100)).toBe("medium");
  });

  it("returns large for > 100 employees", () => {
    expect(getCompanySize(101)).toBe("large");
    expect(getCompanySize(500)).toBe("large");
  });
});
