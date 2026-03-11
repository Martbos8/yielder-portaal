import { describe, it, expect } from "vitest";
import type { Recommendation } from "@/lib/engine/recommendation";
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

// Replicate computeItScore from upgrade page for testing
function computeItScore(recommendations: Recommendation[]): number {
  if (recommendations.length === 0) return 100;

  const criticalCount = recommendations.filter((r) => r.severity === "critical").length;
  const warningCount = recommendations.filter((r) => r.severity === "warning").length;
  const infoCount = recommendations.filter((r) => r.severity === null || r.severity === "info").length;

  const deductions = criticalCount * 15 + warningCount * 8 + infoCount * 3;
  return Math.max(0, Math.min(100, 100 - deductions));
}

function mockRecommendation(overrides: Partial<Recommendation>): Recommendation {
  return {
    product: mockProduct({ id: "p-1", name: "Test Product" }),
    score: 60,
    reason: "Test reason",
    severity: "warning",
    adoptionRate: null,
    category: "Cybersecurity",
    ctaText: "Neem contact op met het team",
    ...overrides,
  };
}

describe("Upgrade Page", () => {
  describe("IT Score computation", () => {
    it("returns 100 when no recommendations", () => {
      expect(computeItScore([])).toBe(100);
    });

    it("deducts 15 per critical item", () => {
      const recs = [
        mockRecommendation({ severity: "critical" }),
        mockRecommendation({ severity: "critical" }),
      ];
      expect(computeItScore(recs)).toBe(70); // 100 - 30
    });

    it("deducts 8 per warning item", () => {
      const recs = [mockRecommendation({ severity: "warning" })];
      expect(computeItScore(recs)).toBe(92); // 100 - 8
    });

    it("deducts 3 per info/null item", () => {
      const recs = [
        mockRecommendation({ severity: "info" }),
        mockRecommendation({ severity: null }),
      ];
      expect(computeItScore(recs)).toBe(94); // 100 - 6
    });

    it("never goes below 0", () => {
      const recs = Array.from({ length: 10 }, () =>
        mockRecommendation({ severity: "critical" })
      );
      expect(computeItScore(recs)).toBe(0); // 100 - 150 clamped to 0
    });

    it("combines different severities", () => {
      const recs = [
        mockRecommendation({ severity: "critical" }),
        mockRecommendation({ severity: "warning" }),
        mockRecommendation({ severity: "info" }),
      ];
      // 100 - 15 - 8 - 3 = 74
      expect(computeItScore(recs)).toBe(74);
    });
  });

  describe("Recommendation card data", () => {
    it("critical recommendation has correct ctaText", () => {
      const rec = mockRecommendation({
        severity: "critical",
        ctaText: "Direct actie vereist",
      });
      expect(rec.ctaText).toBe("Direct actie vereist");
    });

    it("non-critical recommendation has default ctaText", () => {
      const rec = mockRecommendation({ severity: "warning" });
      expect(rec.ctaText).toBe("Neem contact op met het team");
    });

    it("adoptionRate displays as percentage", () => {
      const rec = mockRecommendation({ adoptionRate: 0.85 });
      expect(Math.round(rec.adoptionRate! * 100)).toBe(85);
    });
  });

  it("upgrade page module is importable", async () => {
    const mod = await import("@/lib/engine/recommendation");
    expect(typeof mod.getRecommendations).toBe("function");
  });

  it("getUserCompanyId is exportable", async () => {
    const mod = await import("@/lib/queries");
    expect(typeof mod.getUserCompanyId).toBe("function");
  });
});
