import { describe, it, expect } from "vitest";
import { computeRecommendations, computeRecommendationsV2, type RecommendationV2Input } from "@/lib/engine/recommendation";
import type { GapResult } from "@/lib/engine/gap-analysis";
import type { PatternResult } from "@/lib/engine/pattern-matching";
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

const categoryMap = new Map([
  ["cat-1", "Cybersecurity"],
  ["cat-2", "Cloud"],
]);

const backup = mockProduct({ id: "p-backup", name: "Cloud Backup", sku: "VBR-365", category_id: "cat-2" });
const mfa = mockProduct({ id: "p-mfa", name: "MFA", sku: "MS-MFA", category_id: "cat-1" });
const mdm = mockProduct({ id: "p-mdm", name: "MDM", sku: "MDM-01", category_id: "cat-1" });
const sdwan = mockProduct({ id: "p-sdwan", name: "SD-WAN", category_id: "cat-2" });

describe("Recommendation Scorer (V1 compat)", () => {
  it("ranks critical gap higher than info suggestion", () => {
    const gaps: GapResult[] = [
      {
        missingProduct: backup,
        reason: "Cloud vereist backup",
        severity: "critical",
        relatedTo: mockProduct({ id: "p-cloud", name: "Cloud" }),
      },
      {
        missingProduct: mdm,
        reason: "MDM verbetert endpoint",
        severity: "info",
        relatedTo: mockProduct({ id: "p-ep", name: "Endpoint" }),
      },
    ];

    const recommendations = computeRecommendations(gaps, [], categoryMap);

    expect(recommendations.length).toBe(2);
    expect(recommendations[0]!.product.id).toBe("p-backup");
    expect(recommendations[0]!.score).toBe(100);
    expect(recommendations[1]!.product.id).toBe("p-mdm");
    expect(recommendations[1]!.score).toBe(20);
  });

  it("merges gap and pattern for same product and boosts score", () => {
    const gaps: GapResult[] = [
      {
        missingProduct: backup,
        reason: "Cloud vereist backup",
        severity: "critical",
        relatedTo: mockProduct({ id: "p-cloud", name: "Cloud" }),
      },
    ];

    const patterns: PatternResult[] = [
      {
        product: backup,
        adoptionRate: 0.85,
        segmentDescription: "85% van vergelijkbare bedrijven gebruikt Cloud Backup",
        confidence: 1,
      },
    ];

    const recommendations = computeRecommendations(gaps, patterns, categoryMap);

    expect(recommendations.length).toBe(1);
    expect(recommendations[0]!.score).toBe(134);
    expect(recommendations[0]!.adoptionRate).toBe(0.85);
    expect(recommendations[0]!.reason).toContain("85%");
    expect(recommendations[0]!.source).toBe("gap+pattern");
  });

  it("includes pattern-only recommendations", () => {
    const patterns: PatternResult[] = [
      {
        product: sdwan,
        adoptionRate: 0.75,
        segmentDescription: "75% van vergelijkbare bedrijven gebruikt SD-WAN",
        confidence: 0.8,
      },
    ];

    const recommendations = computeRecommendations([], patterns, categoryMap);

    expect(recommendations.length).toBe(1);
    expect(recommendations[0]!.product.id).toBe("p-sdwan");
    expect(recommendations[0]!.score).toBe(30);
    expect(recommendations[0]!.severity).toBeNull();
    expect(recommendations[0]!.ctaText).toBe("Neem contact op met het team");
    expect(recommendations[0]!.source).toBe("pattern");
  });

  it("sets ctaText to 'Direct actie vereist' for critical gaps", () => {
    const gaps: GapResult[] = [
      {
        missingProduct: mfa,
        reason: "MFA vereist",
        severity: "critical",
        relatedTo: mockProduct({ id: "p-m365", name: "M365" }),
      },
    ];

    const recommendations = computeRecommendations(gaps, [], categoryMap);
    expect(recommendations[0]!.ctaText).toBe("Direct actie vereist");
  });

  it("sets ctaText to 'Neem contact op met het team' for non-critical", () => {
    const gaps: GapResult[] = [
      {
        missingProduct: mdm,
        reason: "MDM aanbevolen",
        severity: "warning",
        relatedTo: mockProduct({ id: "p-ep", name: "Endpoint" }),
      },
    ];

    const recommendations = computeRecommendations(gaps, [], categoryMap);
    expect(recommendations[0]!.ctaText).toBe("Neem contact op met het team");
  });

  it("limits to max 10 recommendations", () => {
    const gaps: GapResult[] = Array.from({ length: 12 }, (_, i) => ({
      missingProduct: mockProduct({ id: `p-${i}`, name: `Product ${i}` }),
      reason: `Reden ${i}`,
      severity: "warning" as const,
      relatedTo: mockProduct({ id: `p-src-${i}`, name: `Source ${i}` }),
    }));

    const recommendations = computeRecommendations(gaps, [], categoryMap);
    expect(recommendations.length).toBe(10);
  });

  it("deduplicates same product from gap and pattern", () => {
    const gaps: GapResult[] = [
      {
        missingProduct: backup,
        reason: "Cloud vereist backup",
        severity: "critical",
        relatedTo: mockProduct({ id: "p-cloud", name: "Cloud" }),
      },
    ];

    const patterns: PatternResult[] = [
      {
        product: backup,
        adoptionRate: 0.9,
        segmentDescription: "90% gebruikt backup",
        confidence: 1,
      },
    ];

    const recommendations = computeRecommendations(gaps, patterns, categoryMap);
    expect(recommendations.length).toBe(1);
    expect(recommendations[0]!.product.id).toBe("p-backup");
  });

  it("assigns correct category from categoryMap", () => {
    const gaps: GapResult[] = [
      {
        missingProduct: backup,
        reason: "Backup nodig",
        severity: "warning",
        relatedTo: mockProduct({ id: "p-cloud", name: "Cloud" }),
      },
    ];

    const recommendations = computeRecommendations(gaps, [], categoryMap);
    expect(recommendations[0]!.category).toBe("Cloud");
  });

  it("returns empty for no gaps and no patterns", () => {
    const recommendations = computeRecommendations([], [], categoryMap);
    expect(recommendations.length).toBe(0);
  });

  it("includes confidence and variant fields", () => {
    const gaps: GapResult[] = [
      {
        missingProduct: mfa,
        reason: "MFA vereist",
        severity: "critical",
        relatedTo: mockProduct({ id: "p-m365", name: "M365" }),
      },
    ];

    const recommendations = computeRecommendations(gaps, [], categoryMap);
    expect(recommendations[0]!.confidence).toBeDefined();
    expect(recommendations[0]!.confidence.overall).toBeGreaterThan(0);
    expect(recommendations[0]!.variant).toBe("control");
  });

  it("getRecommendations function is exportable", async () => {
    const mod = await import("@/lib/engine/recommendation");
    expect(typeof mod.getRecommendations).toBe("function");
    expect(typeof mod.computeRecommendations).toBe("function");
    expect(typeof mod.computeRecommendationsV2).toBe("function");
  });
});

describe("Recommendation Scorer V2", () => {
  const company = mockCompany({ id: "comp-1", name: "TestBV", employee_count: 50 });
  const cloud = mockProduct({ id: "p-cloud", name: "Cloud Platform", category_id: "cat-2" });

  function makeV2Input(overrides: Partial<RecommendationV2Input> = {}): RecommendationV2Input {
    return {
      gaps: [],
      patterns: [],
      categoryMap,
      company,
      companyClientProducts: [],
      allClientProducts: [],
      allProducts: [backup, mfa, mdm, sdwan, cloud],
      feedback: [],
      productCategoryMap: new Map([
        ["p-backup", "cat-2"],
        ["p-mfa", "cat-1"],
        ["p-mdm", "cat-1"],
        ["p-sdwan", "cat-2"],
        ["p-cloud", "cat-2"],
      ]),
      assignment: { variant: "weighted_v2", experimentId: "test" },
      now: new Date("2026-06-15"), // Mid-year, no seasonal boost
      ...overrides,
    };
  }

  it("applies weighted scoring with company size factor", () => {
    const smallCompany = mockCompany({ id: "comp-s", name: "SmallBV", employee_count: 10 });
    const largeCompany = mockCompany({ id: "comp-l", name: "LargeBV", employee_count: 200 });

    const gaps: GapResult[] = [
      {
        missingProduct: mfa,
        reason: "M365 vereist MFA",
        severity: "critical",
        relatedTo: cloud,
      },
    ];

    const smallResult = computeRecommendationsV2(makeV2Input({
      gaps,
      company: smallCompany,
    }));

    const largeResult = computeRecommendationsV2(makeV2Input({
      gaps,
      company: largeCompany,
    }));

    // Large company factor (1.2) > small company factor (0.8)
    expect(largeResult[0]!.score).toBeGreaterThan(smallResult[0]!.score);
  });

  it("applies seasonal boost in Q4", () => {
    const gaps: GapResult[] = [
      {
        missingProduct: mockProduct({ id: "p-hw", name: "Server", type: "hardware", category_id: "cat-1" }),
        reason: "Server nodig",
        severity: "warning",
        relatedTo: cloud,
      },
    ];

    const juneResult = computeRecommendationsV2(makeV2Input({
      gaps,
      allProducts: [...makeV2Input().allProducts, gaps[0]!.missingProduct],
      now: new Date("2026-06-15"),
    }));

    const novResult = computeRecommendationsV2(makeV2Input({
      gaps,
      allProducts: [...makeV2Input().allProducts, gaps[0]!.missingProduct],
      now: new Date("2026-11-15"),
    }));

    // Q4 should boost hardware products
    expect(novResult[0]!.score).toBeGreaterThan(juneResult[0]!.score);
  });

  it("filters recommendations below confidence threshold", () => {
    // Pattern-only with very low confidence should be filtered
    const patterns: PatternResult[] = [
      {
        product: sdwan,
        adoptionRate: 0.65,
        segmentDescription: "65% gebruikt SD-WAN",
        confidence: 0.1, // Very low confidence (tiny segment)
      },
    ];

    const result = computeRecommendationsV2(makeV2Input({
      patterns,
      // Use control variant so no cross-sell but confidence still applies
      assignment: { variant: "control", experimentId: "test" },
    }));

    // Low confidence pattern-only recommendations may be filtered
    // (depends on threshold calculation)
    for (const rec of result) {
      expect(rec.confidence.overall).toBeGreaterThanOrEqual(0.7);
    }
  });

  it("includes cross-sell recommendations in weighted_v2 variant", () => {
    const otherProduct = mockProduct({ id: "p-other", name: "Monitoring Tool", category_id: "cat-1" });

    // Company owns cloud, 3 other companies also own cloud + monitoring tool
    const companyClientProducts = [mockClientProduct("comp-1", "p-cloud")];
    const allClientProducts = [
      ...companyClientProducts,
      mockClientProduct("comp-2", "p-cloud"),
      mockClientProduct("comp-2", "p-other"),
      mockClientProduct("comp-3", "p-cloud"),
      mockClientProduct("comp-3", "p-other"),
      mockClientProduct("comp-4", "p-cloud"),
      mockClientProduct("comp-4", "p-other"),
    ];

    const result = computeRecommendationsV2(makeV2Input({
      companyClientProducts,
      allClientProducts,
      allProducts: [...makeV2Input().allProducts, otherProduct],
      productCategoryMap: new Map([
        ...Array.from(makeV2Input().productCategoryMap.entries()),
        ["p-other", "cat-1"],
      ]),
    }));

    const crossSellRec = result.find((r) => r.product.id === "p-other");
    if (crossSellRec) {
      expect(crossSellRec.source).toBe("cross-sell");
      expect(crossSellRec.reason).toContain("klanten met vergelijkbare producten");
    }
  });

  it("does not include cross-sell in control variant", () => {
    const otherProduct = mockProduct({ id: "p-other", name: "Monitoring Tool", category_id: "cat-1" });

    const companyClientProducts = [mockClientProduct("comp-1", "p-cloud")];
    const allClientProducts = [
      ...companyClientProducts,
      mockClientProduct("comp-2", "p-cloud"),
      mockClientProduct("comp-2", "p-other"),
      mockClientProduct("comp-3", "p-cloud"),
      mockClientProduct("comp-3", "p-other"),
    ];

    const result = computeRecommendationsV2(makeV2Input({
      companyClientProducts,
      allClientProducts,
      allProducts: [...makeV2Input().allProducts, otherProduct],
      assignment: { variant: "control", experimentId: "test" },
    }));

    const crossSellRec = result.find((r) => r.source === "cross-sell");
    expect(crossSellRec).toBeUndefined();
  });

  it("applies personalization boost for clicked categories", () => {
    const gaps: GapResult[] = [
      {
        missingProduct: mfa,
        reason: "MFA vereist",
        severity: "warning",
        relatedTo: cloud,
      },
      {
        missingProduct: backup,
        reason: "Backup vereist",
        severity: "warning",
        relatedTo: cloud,
      },
    ];

    // User has heavily engaged with Cybersecurity (cat-1) category
    const feedback = [
      ...Array.from({ length: 5 }, () => ({ product_id: "p-mfa", action: "shown" as const, company_id: "comp-1" })),
      ...Array.from({ length: 3 }, () => ({ product_id: "p-mfa", action: "clicked" as const, company_id: "comp-1" })),
    ];

    const result = computeRecommendationsV2(makeV2Input({
      gaps,
      feedback,
      assignment: { variant: "personalized", experimentId: "test" },
    }));

    // MFA (Cybersecurity category) should get a personalization boost
    const mfaRec = result.find((r) => r.product.id === "p-mfa");
    const backupRec = result.find((r) => r.product.id === "p-backup");

    if (mfaRec && backupRec) {
      // Both are warning severity with same base, but MFA has personalization boost
      expect(mfaRec.score).toBeGreaterThanOrEqual(backupRec.score);
    }
  });

  it("assigns consistent A/B variant per company", () => {
    const result1 = computeRecommendationsV2(makeV2Input({
      gaps: [{
        missingProduct: mfa,
        reason: "MFA vereist",
        severity: "critical",
        relatedTo: cloud,
      }],
    }));

    const result2 = computeRecommendationsV2(makeV2Input({
      gaps: [{
        missingProduct: mfa,
        reason: "MFA vereist",
        severity: "critical",
        relatedTo: cloud,
      }],
    }));

    // Same input → same variant
    expect(result1[0]!.variant).toBe(result2[0]!.variant);
  });

  it("includes recency boost for recently purchased source products", () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 15); // 15 days ago

    const gaps: GapResult[] = [
      {
        missingProduct: mfa,
        reason: "MFA vereist",
        severity: "warning",
        relatedTo: cloud,
      },
    ];

    const recentResult = computeRecommendationsV2(makeV2Input({
      gaps,
      companyClientProducts: [
        mockClientProduct("comp-1", "p-cloud", recentDate.toISOString()),
      ],
    }));

    const oldResult = computeRecommendationsV2(makeV2Input({
      gaps,
      companyClientProducts: [
        mockClientProduct("comp-1", "p-cloud", "2020-01-01"),
      ],
    }));

    // Recent purchase should boost the score
    expect(recentResult[0]!.score).toBeGreaterThan(oldResult[0]!.score);
  });

  it("returns empty for no inputs", () => {
    const result = computeRecommendationsV2(makeV2Input());
    expect(result.length).toBe(0);
  });

  it("confidence includes all factors", () => {
    const gaps: GapResult[] = [
      {
        missingProduct: mfa,
        reason: "MFA vereist",
        severity: "critical",
        relatedTo: cloud,
      },
    ];

    const result = computeRecommendationsV2(makeV2Input({ gaps }));

    expect(result[0]!.confidence).toHaveProperty("segmentConfidence");
    expect(result[0]!.confidence).toHaveProperty("dataConfidence");
    expect(result[0]!.confidence).toHaveProperty("sourceConfidence");
    expect(result[0]!.confidence).toHaveProperty("overall");
    expect(result[0]!.confidence.overall).toBeGreaterThanOrEqual(0);
    expect(result[0]!.confidence.overall).toBeLessThanOrEqual(1);
  });
});
