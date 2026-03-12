import { createClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import type {
  Product,
  ProductDependency,
  ClientProduct,
  Company,
  RecommendationFeedback,
} from "@/types/database";
import { computeGaps, type GapResult, type GapSeverity } from "./gap-analysis";
import { computePatterns, type PatternResult } from "./pattern-matching";
import {
  computeWeightedScore,
  computeSeasonalFactor,
  computeCrossSells,
  computeConfidence,
  assignVariant,
  getVariantFeatures,
  computeCategoryPreferences,
  applyPersonalizationBoost,
  type ABVariant,
  type ABAssignment,
  type ConfidenceFactors,
} from "./scoring";
import { adjustScore } from "./learning";

const log = createLogger("engine:recommendation");

export type Recommendation = {
  product: Product;
  score: number;
  reason: string;
  severity: GapSeverity | null;
  adoptionRate: number | null;
  category: string;
  ctaText: string;
  /** Confidence score (0-1). Only shown to user if >= CONFIDENCE_THRESHOLD. */
  confidence: ConfidenceFactors;
  /** A/B test variant that generated this recommendation */
  variant: ABVariant;
  /** Source of the recommendation */
  source: "gap" | "pattern" | "cross-sell" | "gap+pattern";
};

const SEVERITY_WEIGHT: Record<GapSeverity, number> = {
  critical: 100,
  warning: 60,
  info: 20,
};

const MAX_RECOMMENDATIONS = 10;
const CONFIDENCE_THRESHOLD = 0.7;
const CURRENT_EXPERIMENT = "rec-engine-v2";

/**
 * Fetches all data and computes ranked recommendations for a company.
 * V2: includes weighted scoring, seasonal patterns, cross-sell, confidence,
 * A/B testing, and personalization.
 */
export async function getRecommendations(
  companyId: string
): Promise<Recommendation[]> {
  const supabase = await createClient();

  const [companyRes, companiesRes, clientProductsRes, productsRes, depsRes, categoriesRes, feedbackRes] =
    await Promise.all([
      supabase.from("companies").select("*").eq("id", companyId).single(),
      supabase.from("companies").select("*"),
      supabase.from("client_products").select("*").eq("status", "active"),
      supabase.from("products").select("*").eq("is_active", true),
      supabase.from("product_dependencies").select("*"),
      supabase.from("product_categories").select("*"),
      supabase
        .from("recommendation_feedback")
        .select("product_id, action, company_id")
        .eq("company_id", companyId),
    ]);

  const company = companyRes.data as Company | null;
  if (!company) {
    log.warn("Company not found for recommendations", { companyId });
    return [];
  }

  const allCompanies = (companiesRes.data ?? []) as Company[];
  const allClientProducts = (clientProductsRes.data ?? []) as ClientProduct[];
  const allProducts = (productsRes.data ?? []) as Product[];
  const dependencies = (depsRes.data ?? []) as ProductDependency[];
  const feedback = (feedbackRes.data ?? []) as Pick<
    RecommendationFeedback,
    "product_id" | "action" | "company_id"
  >[];

  const categoryMap = new Map(
    ((categoriesRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name])
  );

  // Filter client products for this company
  const companyClientProducts = allClientProducts.filter(
    (cp) => cp.company_id === companyId
  );

  // A/B test assignment
  const assignment = assignVariant(companyId, CURRENT_EXPERIMENT);

  const start = Date.now();
  const gaps = computeGaps(companyClientProducts, dependencies, allProducts);
  const patterns = computePatterns(company, allCompanies, allClientProducts, allProducts);

  // Build product → category mapping for feedback
  const productCategoryMap = new Map(
    allProducts.map((p) => [p.id, p.category_id])
  );

  const recommendations = computeRecommendationsV2({
    gaps,
    patterns,
    categoryMap,
    company,
    companyClientProducts,
    allClientProducts,
    allProducts,
    feedback,
    productCategoryMap,
    assignment,
  });

  log.debug("Recommendations v2 computed", {
    companyId,
    variant: assignment.variant,
    gaps: gaps.length,
    patterns: patterns.length,
    recommendations: recommendations.length,
    durationMs: Date.now() - start,
  });

  return recommendations;
}

export type RecommendationV2Input = {
  gaps: GapResult[];
  patterns: PatternResult[];
  categoryMap: Map<string, string>;
  company: Company;
  companyClientProducts: ClientProduct[];
  allClientProducts: ClientProduct[];
  allProducts: Product[];
  feedback: Array<Pick<RecommendationFeedback, "product_id" | "action" | "company_id">>;
  productCategoryMap: Map<string, string>;
  assignment: ABAssignment;
  now?: Date;
};

/**
 * V2 pure function that combines gap analysis, pattern matching, cross-sell,
 * seasonal patterns, personalization, and confidence into ranked recommendations.
 */
export function computeRecommendationsV2(input: RecommendationV2Input): Recommendation[] {
  const {
    gaps,
    patterns,
    categoryMap,
    company,
    companyClientProducts,
    allClientProducts,
    allProducts,
    feedback,
    productCategoryMap,
    assignment,
    now = new Date(),
  } = input;

  const features = getVariantFeatures(assignment.variant);
  const recommendationMap = new Map<string, Recommendation>();

  // Build feedback lookup per product
  const feedbackByProduct = new Map<string, string[]>();
  for (const fb of feedback) {
    const existing = feedbackByProduct.get(fb.product_id);
    if (existing) {
      existing.push(fb.action);
    } else {
      feedbackByProduct.set(fb.product_id, [fb.action]);
    }
  }

  // Compute personalization preferences
  const feedbackWithCategory = feedback.map((fb) => ({
    productId: fb.product_id,
    action: fb.action,
    categoryId: productCategoryMap.get(fb.product_id) ?? "",
  }));
  const categoryPreferences = features.usePersonalization
    ? computeCategoryPreferences(feedbackWithCategory, categoryMap)
    : new Map<string, number>();

  // Count segment size for confidence
  const segmentSize = patterns.length > 0
    ? patterns[0]!.confidence * 10 // Reverse-engineer segment size from confidence
    : 0;

  // ── Process gap results ──────────────────────────────────────
  for (const gap of gaps) {
    const productId = gap.missingProduct.id;
    const categoryName = categoryMap.get(gap.missingProduct.category_id) ?? "Overig";

    // V1 or V2 scoring
    let score: number;
    if (features.useWeightedScoring) {
      score = computeWeightedScore(
        gap.severity,
        company,
        gap.relatedTo.id,
        companyClientProducts
      );
    } else {
      score = SEVERITY_WEIGHT[gap.severity];
    }

    // Seasonal boost
    if (features.useSeasonalBoost) {
      score = Math.round(score * computeSeasonalFactor(gap.missingProduct, categoryName, now));
    }

    // Learning adjustment
    const productFeedback = feedbackByProduct.get(productId) ?? [];
    score = adjustScore(score, productFeedback);

    // Personalization
    if (features.usePersonalization) {
      score = applyPersonalizationBoost(score, categoryName, categoryPreferences);
    }

    const confidence = computeConfidence(
      true,
      segmentSize,
      productFeedback.length,
      null
    );

    recommendationMap.set(productId, {
      product: gap.missingProduct,
      score,
      reason: gap.reason,
      severity: gap.severity,
      adoptionRate: null,
      category: categoryName,
      ctaText: gap.severity === "critical" ? "Direct actie vereist" : "Neem contact op met het team",
      confidence,
      variant: assignment.variant,
      source: "gap",
    });
  }

  // ── Process pattern results ──────────────────────────────────
  for (const pattern of patterns) {
    const productId = pattern.product.id;
    const categoryName = categoryMap.get(pattern.product.category_id) ?? "Overig";
    const adoptionBonus = Math.round(pattern.adoptionRate * 40);
    const existing = recommendationMap.get(productId);

    const productFeedback = feedbackByProduct.get(productId) ?? [];

    if (existing) {
      // Merge: add adoption bonus to existing gap score
      let bonus = adoptionBonus;
      if (features.useSeasonalBoost) {
        bonus = Math.round(bonus * computeSeasonalFactor(pattern.product, categoryName, now));
      }
      existing.score += bonus;
      existing.adoptionRate = pattern.adoptionRate;
      existing.reason += `. ${pattern.segmentDescription}`;
      existing.source = "gap+pattern";

      // Recalculate confidence with adoption data
      existing.confidence = computeConfidence(
        true,
        segmentSize,
        productFeedback.length,
        pattern.adoptionRate
      );
    } else {
      let score = adoptionBonus;

      if (features.useSeasonalBoost) {
        score = Math.round(score * computeSeasonalFactor(pattern.product, categoryName, now));
      }

      score = adjustScore(score, productFeedback);

      if (features.usePersonalization) {
        score = applyPersonalizationBoost(score, categoryName, categoryPreferences);
      }

      const confidence = computeConfidence(
        false,
        segmentSize,
        productFeedback.length,
        pattern.adoptionRate
      );

      recommendationMap.set(productId, {
        product: pattern.product,
        score,
        reason: pattern.segmentDescription,
        severity: null,
        adoptionRate: pattern.adoptionRate,
        category: categoryName,
        ctaText: "Neem contact op met het team",
        confidence,
        variant: assignment.variant,
        source: "pattern",
      });
    }
  }

  // ── Cross-sell results ───────────────────────────────────────
  if (features.useCrossSell) {
    const crossSells = computeCrossSells(
      companyClientProducts,
      allClientProducts,
      allProducts,
      0.5
    );

    for (const cs of crossSells) {
      const productId = cs.product.id;
      if (recommendationMap.has(productId)) continue; // Already recommended from gap/pattern

      const categoryName = categoryMap.get(cs.product.category_id) ?? "Overig";
      const productFeedback = feedbackByProduct.get(productId) ?? [];

      let score = Math.round(cs.coOccurrenceRate * 30); // Max 30 for cross-sell

      if (features.useSeasonalBoost) {
        score = Math.round(score * computeSeasonalFactor(cs.product, categoryName, now));
      }

      score = adjustScore(score, productFeedback);

      if (features.usePersonalization) {
        score = applyPersonalizationBoost(score, categoryName, categoryPreferences);
      }

      const confidence = computeConfidence(
        false,
        0,
        productFeedback.length,
        cs.coOccurrenceRate
      );

      recommendationMap.set(productId, {
        product: cs.product,
        score,
        reason: cs.description,
        severity: null,
        adoptionRate: cs.coOccurrenceRate,
        category: categoryName,
        ctaText: "Neem contact op met het team",
        confidence,
        variant: assignment.variant,
        source: "cross-sell",
      });
    }
  }

  // ── Filter by confidence threshold ───────────────────────────
  const allRecs = Array.from(recommendationMap.values());
  const confident = allRecs.filter(
    (r) => r.confidence.overall >= CONFIDENCE_THRESHOLD
  );

  // Sort by score DESC, take top MAX_RECOMMENDATIONS
  confident.sort((a, b) => b.score - a.score);

  return confident.slice(0, MAX_RECOMMENDATIONS);
}

/**
 * V1 pure function (backward compatible) that combines gap analysis and pattern
 * matching results into a single ranked list of recommendations.
 */
export function computeRecommendations(
  gaps: GapResult[],
  patterns: PatternResult[],
  categoryMap: Map<string, string>
): Recommendation[] {
  const recommendationMap = new Map<string, Recommendation>();

  // Process gap results
  for (const gap of gaps) {
    const productId = gap.missingProduct.id;
    const score = SEVERITY_WEIGHT[gap.severity];

    recommendationMap.set(productId, {
      product: gap.missingProduct,
      score,
      reason: gap.reason,
      severity: gap.severity,
      adoptionRate: null,
      category: categoryMap.get(gap.missingProduct.category_id) ?? "Overig",
      ctaText: gap.severity === "critical" ? "Direct actie vereist" : "Neem contact op met het team",
      confidence: { segmentConfidence: 0, dataConfidence: 0, sourceConfidence: 0.9, overall: 1.0 },
      variant: "control",
      source: "gap",
    });
  }

  // Process pattern results — merge if same product already exists from gaps
  for (const pattern of patterns) {
    const productId = pattern.product.id;
    const adoptionBonus = Math.round(pattern.adoptionRate * 40);
    const existing = recommendationMap.get(productId);

    if (existing) {
      existing.score += adoptionBonus;
      existing.adoptionRate = pattern.adoptionRate;
      existing.reason += `. ${pattern.segmentDescription}`;
      existing.source = "gap+pattern";
    } else {
      recommendationMap.set(productId, {
        product: pattern.product,
        score: adoptionBonus,
        reason: pattern.segmentDescription,
        severity: null,
        adoptionRate: pattern.adoptionRate,
        category: categoryMap.get(pattern.product.category_id) ?? "Overig",
        ctaText: "Neem contact op met het team",
        confidence: { segmentConfidence: pattern.confidence, dataConfidence: 0, sourceConfidence: 0.5, overall: 0.75 },
        variant: "control",
        source: "pattern",
      });
    }
  }

  // Sort by score DESC, take top MAX_RECOMMENDATIONS
  const sorted = Array.from(recommendationMap.values()).sort(
    (a, b) => b.score - a.score
  );

  return sorted.slice(0, MAX_RECOMMENDATIONS);
}
