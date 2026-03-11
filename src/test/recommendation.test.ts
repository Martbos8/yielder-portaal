import { describe, it, expect } from "vitest";
import { computeRecommendations } from "@/lib/engine/recommendation";
import type { GapResult } from "@/lib/engine/gap-analysis";
import type { PatternResult } from "@/lib/engine/pattern-matching";
import type { Product } from "@/types/database";

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

const categoryMap = new Map([
  ["cat-1", "Cybersecurity"],
  ["cat-2", "Cloud"],
]);

const backup = mockProduct({ id: "p-backup", name: "Cloud Backup", sku: "VBR-365", category_id: "cat-2" });
const mfa = mockProduct({ id: "p-mfa", name: "MFA", sku: "MS-MFA", category_id: "cat-1" });
const mdm = mockProduct({ id: "p-mdm", name: "MDM", sku: "MDM-01", category_id: "cat-1" });
const sdwan = mockProduct({ id: "p-sdwan", name: "SD-WAN", category_id: "cat-2" });

describe("Recommendation Scorer", () => {
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
    expect(recommendations[0].product.id).toBe("p-backup");
    expect(recommendations[0].score).toBe(100); // critical = 100
    expect(recommendations[1].product.id).toBe("p-mdm");
    expect(recommendations[1].score).toBe(20); // info = 20
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
    // 100 (critical) + 34 (0.85 * 40 rounded)
    expect(recommendations[0].score).toBe(134);
    expect(recommendations[0].adoptionRate).toBe(0.85);
    expect(recommendations[0].reason).toContain("85%");
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
    expect(recommendations[0].product.id).toBe("p-sdwan");
    expect(recommendations[0].score).toBe(30); // 0.75 * 40 = 30
    expect(recommendations[0].severity).toBeNull();
    expect(recommendations[0].ctaText).toBe("Neem contact op met het team");
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
    expect(recommendations[0].ctaText).toBe("Direct actie vereist");
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
    expect(recommendations[0].ctaText).toBe("Neem contact op met het team");
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
    // Should be 1, not 2
    expect(recommendations.length).toBe(1);
    expect(recommendations[0].product.id).toBe("p-backup");
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
    expect(recommendations[0].category).toBe("Cloud");
  });

  it("returns empty for no gaps and no patterns", () => {
    const recommendations = computeRecommendations([], [], categoryMap);
    expect(recommendations.length).toBe(0);
  });

  it("getRecommendations function is exportable", async () => {
    const mod = await import("@/lib/engine/recommendation");
    expect(typeof mod.getRecommendations).toBe("function");
    expect(typeof mod.computeRecommendations).toBe("function");
  });
});
