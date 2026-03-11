import { describe, it, expect } from "vitest";
import {
  computeConversionRate,
  computeConversionMultiplier,
  adjustScore,
} from "@/lib/engine/learning";

describe("Learning Engine", () => {
  describe("computeConversionRate", () => {
    it("returns 1.0 (neutral) when fewer than 50 shown events", () => {
      const actions = Array(30).fill("shown").concat(Array(5).fill("purchased"));
      expect(computeConversionRate(actions)).toBe(1.0);
    });

    it("returns 1.0 when no data at all", () => {
      expect(computeConversionRate([])).toBe(1.0);
    });

    it("calculates correct rate with enough data points", () => {
      const actions = Array(100).fill("shown").concat(Array(10).fill("purchased"));
      // 10 purchased / 100 shown = 0.10
      expect(computeConversionRate(actions)).toBe(0.1);
    });

    it("returns 0 when shown but never purchased", () => {
      const actions = Array(60).fill("shown").concat(Array(20).fill("clicked"));
      expect(computeConversionRate(actions)).toBe(0);
    });

    it("ignores non-shown/purchased actions in rate calculation", () => {
      const actions = [
        ...Array(50).fill("shown"),
        ...Array(5).fill("purchased"),
        ...Array(20).fill("clicked"),
        ...Array(10).fill("contacted"),
        ...Array(3).fill("dismissed"),
      ];
      // 5/50 = 0.1
      expect(computeConversionRate(actions)).toBe(0.1);
    });
  });

  describe("computeConversionMultiplier", () => {
    it("returns 1.0 (neutral) with insufficient data", () => {
      const actions = Array(10).fill("shown");
      expect(computeConversionMultiplier(actions)).toBe(1.0);
    });

    it("returns MIN_MULTIPLIER (0.5) when conversion rate is 0", () => {
      const actions = Array(60).fill("shown"); // No purchases
      expect(computeConversionMultiplier(actions)).toBe(0.5);
    });

    it("returns MAX_MULTIPLIER (2.0) for high conversion rate", () => {
      const actions = Array(50).fill("shown").concat(Array(10).fill("purchased"));
      // rate = 10/50 = 0.2, multiplier = 0.5 + 0.2*15 = 3.5, clamped to 2.0
      expect(computeConversionMultiplier(actions)).toBe(2.0);
    });

    it("returns value between 0.5 and 2.0 for moderate conversion", () => {
      const actions = Array(100).fill("shown").concat(Array(3).fill("purchased"));
      // rate = 3/100 = 0.03, multiplier = 0.5 + 0.03*15 = 0.95
      const multiplier = computeConversionMultiplier(actions);
      expect(multiplier).toBeGreaterThanOrEqual(0.5);
      expect(multiplier).toBeLessThanOrEqual(2.0);
      expect(multiplier).toBeCloseTo(0.95);
    });
  });

  describe("adjustScore", () => {
    it("does not adjust score with insufficient data", () => {
      const actions = Array(10).fill("shown");
      expect(adjustScore(100, actions)).toBe(100); // multiplier = 1.0
    });

    it("halves score for product never purchased", () => {
      const actions = Array(60).fill("shown"); // 0 purchases
      expect(adjustScore(100, actions)).toBe(50); // multiplier = 0.5
    });

    it("doubles score for high-conversion product", () => {
      const actions = Array(50).fill("shown").concat(Array(15).fill("purchased"));
      // rate = 15/50 = 0.3, multiplier clamped to 2.0
      expect(adjustScore(100, actions)).toBe(200);
    });

    it("rounds adjusted score to nearest integer", () => {
      const actions = Array(100).fill("shown").concat(Array(3).fill("purchased"));
      // rate = 0.03, multiplier ≈ 0.95
      const adjusted = adjustScore(60, actions);
      expect(adjusted).toBe(Math.round(adjusted)); // Always integer
    });
  });

  describe("module exports", () => {
    it("recordFeedback and getConversionRate are exportable", async () => {
      const mod = await import("@/lib/engine/learning");
      expect(typeof mod.recordFeedback).toBe("function");
      expect(typeof mod.getConversionRate).toBe("function");
      expect(typeof mod.computeConversionRate).toBe("function");
      expect(typeof mod.computeConversionMultiplier).toBe("function");
      expect(typeof mod.adjustScore).toBe("function");
    });
  });
});
