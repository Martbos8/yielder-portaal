import { describe, it, expect } from "vitest";
import {
  computeRecencyFactor,
  computeWeightedScore,
  computeSeasonalFactor,
  computeCrossSells,
  computeConfidence,
  assignVariant,
  getVariantFeatures,
  computeCategoryPreferences,
  applyPersonalizationBoost,
} from "@/lib/engine/scoring";
import type { Product, Company, ClientProduct } from "@/types/database";

function mockProduct(overrides: Partial<Product> & { id: string; name: string }): Product {
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

function mockCompany(overrides: Partial<Company> & { id: string; name: string }): Company {
  return {
    cw_company_id: null,
    employee_count: 50,
    industry: "IT",
    region: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  };
}

function mockClientProduct(companyId: string, productId: string, purchaseDate?: string): ClientProduct {
  return {
    id: `cp-${companyId}-${productId}`,
    company_id: companyId,
    product_id: productId,
    quantity: 1,
    purchase_date: purchaseDate ?? null,
    expiry_date: null,
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
}

describe("Recency Factor", () => {
  it("returns 1.0 when no purchase date", () => {
    const cp = mockClientProduct("c1", "p1");
    expect(computeRecencyFactor("p1", [cp])).toBe(1.0);
  });

  it("returns 1.3 for purchase within 30 days", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 10);
    const cp = mockClientProduct("c1", "p1", recent.toISOString());
    expect(computeRecencyFactor("p1", [cp])).toBe(1.3);
  });

  it("returns 1.2 for purchase within 90 days", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 60);
    const cp = mockClientProduct("c1", "p1", recent.toISOString());
    expect(computeRecencyFactor("p1", [cp])).toBe(1.2);
  });

  it("returns 1.1 for purchase within 180 days", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 120);
    const cp = mockClientProduct("c1", "p1", recent.toISOString());
    expect(computeRecencyFactor("p1", [cp])).toBe(1.1);
  });

  it("returns 1.0 for old purchase", () => {
    const cp = mockClientProduct("c1", "p1", "2020-01-01");
    expect(computeRecencyFactor("p1", [cp])).toBe(1.0);
  });

  it("returns 1.0 when product not found", () => {
    expect(computeRecencyFactor("p-unknown", [])).toBe(1.0);
  });
});

describe("Weighted Score", () => {
  it("applies company size factor", () => {
    const small = mockCompany({ id: "c1", name: "Small", employee_count: 5 });
    const large = mockCompany({ id: "c2", name: "Large", employee_count: 200 });

    const scoreSmall = computeWeightedScore("critical", small, "p1", []);
    const scoreLarge = computeWeightedScore("critical", large, "p1", []);

    // small: 100 * 0.8 = 80, large: 100 * 1.2 = 120
    expect(scoreSmall).toBe(80);
    expect(scoreLarge).toBe(120);
  });

  it("combines severity, size, and recency", () => {
    const company = mockCompany({ id: "c1", name: "Medium", employee_count: 50 });
    const recent = new Date();
    recent.setDate(recent.getDate() - 10);
    const cp = mockClientProduct("c1", "p1", recent.toISOString());

    // critical (100) * medium (1.0) * recent (1.3) = 130
    const score = computeWeightedScore("critical", company, "p1", [cp]);
    expect(score).toBe(130);
  });
});

describe("Seasonal Factor", () => {
  const hwProduct = mockProduct({ id: "p1", name: "Server", type: "hardware" });
  const swProduct = mockProduct({ id: "p2", name: "Antivirus", type: "software" });

  it("returns 1.25 for hardware in Q4", () => {
    const november = new Date("2026-11-15");
    expect(computeSeasonalFactor(hwProduct, "Infrastructure", november)).toBe(1.25);
  });

  it("returns 1.1 for software in Q4 (general Q4 boost)", () => {
    const november = new Date("2026-11-15");
    expect(computeSeasonalFactor(swProduct, "Overig", november)).toBe(1.1);
  });

  it("returns 1.25 for security category in Q4", () => {
    const december = new Date("2026-12-01");
    expect(computeSeasonalFactor(swProduct, "Cybersecurity", december)).toBe(1.25);
  });

  it("returns 1.05 in Q1", () => {
    const january = new Date("2026-01-15");
    expect(computeSeasonalFactor(swProduct, "Overig", january)).toBe(1.05);
  });

  it("returns 1.0 in Q2/Q3", () => {
    const june = new Date("2026-06-15");
    expect(computeSeasonalFactor(swProduct, "Overig", june)).toBe(1.0);
  });
});

describe("Cross-sell", () => {
  const productA = mockProduct({ id: "p-a", name: "Product A" });
  const productB = mockProduct({ id: "p-b", name: "Product B" });
  const productC = mockProduct({ id: "p-c", name: "Product C" });
  const allProducts = [productA, productB, productC];

  it("finds co-occurring products", () => {
    const companyProducts = [mockClientProduct("comp-1", "p-a")];
    const allClientProducts = [
      ...companyProducts,
      // 3 other companies all have A + B
      mockClientProduct("comp-2", "p-a"),
      mockClientProduct("comp-2", "p-b"),
      mockClientProduct("comp-3", "p-a"),
      mockClientProduct("comp-3", "p-b"),
      mockClientProduct("comp-4", "p-a"),
      mockClientProduct("comp-4", "p-b"),
    ];

    const results = computeCrossSells(companyProducts, allClientProducts, allProducts);
    expect(results.length).toBe(1);
    expect(results[0]!.product.id).toBe("p-b");
    expect(results[0]!.coOccurrenceRate).toBe(0.75); // 3 of 4 companies with A also have B
    expect(results[0]!.description).toContain("Product B");
  });

  it("filters below minimum co-occurrence", () => {
    const companyProducts = [mockClientProduct("comp-1", "p-a")];
    const allClientProducts = [
      ...companyProducts,
      mockClientProduct("comp-2", "p-a"),
      mockClientProduct("comp-2", "p-b"),
      // Only 1 of 2 total = 50%, but need to account for comp-1 too
      mockClientProduct("comp-3", "p-a"),
    ];

    const results = computeCrossSells(companyProducts, allClientProducts, allProducts, 0.8);
    expect(results.length).toBe(0);
  });

  it("skips products already owned", () => {
    const companyProducts = [
      mockClientProduct("comp-1", "p-a"),
      mockClientProduct("comp-1", "p-b"),
    ];
    const allClientProducts = [
      ...companyProducts,
      mockClientProduct("comp-2", "p-a"),
      mockClientProduct("comp-2", "p-b"),
    ];

    const results = computeCrossSells(companyProducts, allClientProducts, allProducts);
    expect(results.length).toBe(0);
  });

  it("returns empty when company owns nothing", () => {
    const results = computeCrossSells([], [], allProducts);
    expect(results.length).toBe(0);
  });
});

describe("Confidence", () => {
  it("gives high confidence for gap-based recommendations", () => {
    const conf = computeConfidence(true, 20, 100, null);
    expect(conf.sourceConfidence).toBe(0.9);
    expect(conf.overall).toBeGreaterThanOrEqual(0.7);
  });

  it("gives lower confidence for pattern-only with small segment", () => {
    const conf = computeConfidence(false, 2, 0, 0.7);
    expect(conf.sourceConfidence).toBe(0.5);
    expect(conf.segmentConfidence).toBeLessThan(0.6);
  });

  it("scales segment confidence with segment size", () => {
    const small = computeConfidence(false, 3, 0, null);
    const large = computeConfidence(false, 25, 0, null);
    expect(large.segmentConfidence).toBeGreaterThan(small.segmentConfidence);
  });

  it("scales data confidence with feedback count", () => {
    const noData = computeConfidence(true, 10, 0, null);
    const lotsData = computeConfidence(true, 10, 200, null);
    expect(lotsData.dataConfidence).toBeGreaterThan(noData.dataConfidence);
  });

  it("overall is between 0 and 1", () => {
    const conf = computeConfidence(true, 50, 500, 1.0);
    expect(conf.overall).toBeGreaterThanOrEqual(0);
    expect(conf.overall).toBeLessThanOrEqual(1);
  });
});

describe("A/B Test Assignment", () => {
  it("returns consistent variant for same company + experiment", () => {
    const a1 = assignVariant("comp-1", "exp-1");
    const a2 = assignVariant("comp-1", "exp-1");
    expect(a1.variant).toBe(a2.variant);
    expect(a1.experimentId).toBe("exp-1");
  });

  it("different companies may get different variants", () => {
    // Not guaranteed but statistically likely with enough companies
    const variants = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const a = assignVariant(`comp-${i}`, "exp-1");
      variants.add(a.variant);
    }
    // Should have at least 2 different variants
    expect(variants.size).toBeGreaterThanOrEqual(2);
  });

  it("different experiments give different assignments", () => {
    const a1 = assignVariant("comp-1", "exp-A");
    const a2 = assignVariant("comp-1", "exp-B");
    // Not guaranteed to differ, but experimentId should be correct
    expect(a1.experimentId).toBe("exp-A");
    expect(a2.experimentId).toBe("exp-B");
  });
});

describe("Variant Features", () => {
  it("control disables all v2 features", () => {
    const f = getVariantFeatures("control");
    expect(f.useWeightedScoring).toBe(false);
    expect(f.useSeasonalBoost).toBe(false);
    expect(f.usePersonalization).toBe(false);
    expect(f.useCrossSell).toBe(false);
  });

  it("weighted_v2 enables scoring and seasonal and cross-sell", () => {
    const f = getVariantFeatures("weighted_v2");
    expect(f.useWeightedScoring).toBe(true);
    expect(f.useSeasonalBoost).toBe(true);
    expect(f.useCrossSell).toBe(true);
    expect(f.usePersonalization).toBe(false);
  });

  it("personalized enables all features", () => {
    const f = getVariantFeatures("personalized");
    expect(f.useWeightedScoring).toBe(true);
    expect(f.useSeasonalBoost).toBe(true);
    expect(f.usePersonalization).toBe(true);
    expect(f.useCrossSell).toBe(true);
  });
});

describe("Category Preferences (Personalization)", () => {
  const categoryMap = new Map([
    ["cat-1", "Cybersecurity"],
    ["cat-2", "Cloud"],
  ]);

  it("computes boost for heavily clicked categories", () => {
    const feedback = [
      ...Array.from({ length: 10 }, () => ({ productId: "p1", action: "shown", categoryId: "cat-1" })),
      ...Array.from({ length: 5 }, () => ({ productId: "p1", action: "clicked", categoryId: "cat-1" })),
    ];

    const prefs = computeCategoryPreferences(feedback, categoryMap);
    const boost = prefs.get("Cybersecurity") ?? 1.0;
    expect(boost).toBeGreaterThan(1.0);
    expect(boost).toBeLessThanOrEqual(1.5);
  });

  it("returns empty map when no engagement data", () => {
    const feedback = [
      { productId: "p1", action: "shown", categoryId: "cat-1" },
    ];

    const prefs = computeCategoryPreferences(feedback, categoryMap);
    expect(prefs.size).toBe(0); // No clicks → no preferences
  });

  it("caps boost at 1.5", () => {
    const feedback = [
      ...Array.from({ length: 1 }, () => ({ productId: "p1", action: "shown", categoryId: "cat-1" })),
      ...Array.from({ length: 10 }, () => ({ productId: "p1", action: "clicked", categoryId: "cat-1" })),
    ];

    const prefs = computeCategoryPreferences(feedback, categoryMap);
    const boost = prefs.get("Cybersecurity") ?? 1.0;
    expect(boost).toBeLessThanOrEqual(1.5);
  });
});

describe("Personalization Boost", () => {
  it("applies boost when category has preference", () => {
    const prefs = new Map([["Cybersecurity", 1.3]]);
    expect(applyPersonalizationBoost(100, "Cybersecurity", prefs)).toBe(130);
  });

  it("returns unchanged score for unknown category", () => {
    const prefs = new Map([["Cloud", 1.3]]);
    expect(applyPersonalizationBoost(100, "Cybersecurity", prefs)).toBe(100);
  });

  it("returns unchanged score for empty preferences", () => {
    expect(applyPersonalizationBoost(100, "Cybersecurity", new Map())).toBe(100);
  });
});
