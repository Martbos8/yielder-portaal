import type { Company, CompanySize, ClientProduct, Product } from "@/types/database";
import { getCompanySize } from "./pattern-matching";
import type { GapSeverity } from "./gap-analysis";

// ── Weighted Scoring ───────────────────────────────────────────────

const SEVERITY_BASE: Record<GapSeverity, number> = {
  critical: 100,
  warning: 60,
  info: 20,
};

const COMPANY_SIZE_FACTOR: Record<CompanySize, number> = {
  small: 0.8,
  medium: 1.0,
  large: 1.2,
};

/**
 * Computes recency factor: products the company purchased recently
 * get a slight boost on related gap recommendations.
 * Range: 0.8 (no recent purchases) to 1.3 (purchased related product within 30 days).
 */
export function computeRecencyFactor(
  relatedProductId: string,
  clientProducts: ClientProduct[]
): number {
  const related = clientProducts.find(
    (cp) => cp.product_id === relatedProductId
  );
  if (!related?.purchase_date) return 1.0;

  const purchaseDate = new Date(related.purchase_date);
  const now = new Date();
  const daysSincePurchase = Math.floor(
    (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Recently purchased the source product → more likely to buy complementary
  if (daysSincePurchase <= 30) return 1.3;
  if (daysSincePurchase <= 90) return 1.2;
  if (daysSincePurchase <= 180) return 1.1;
  return 1.0;
}

/**
 * Computes the weighted score for a gap-based recommendation.
 * Formula: baseSeverity × companySizeFactor × recencyFactor
 */
export function computeWeightedScore(
  severity: GapSeverity,
  company: Company,
  relatedProductId: string,
  clientProducts: ClientProduct[]
): number {
  const base = SEVERITY_BASE[severity];
  const sizeFactor = COMPANY_SIZE_FACTOR[getCompanySize(company.employee_count)];
  const recency = computeRecencyFactor(relatedProductId, clientProducts);

  return Math.round(base * sizeFactor * recency);
}

// ── Seasonal Patterns ──────────────────────────────────────────────

/** Product categories that are more relevant during budget season (Q4: Oct-Dec) */
const Q4_BOOST_CATEGORIES = new Set([
  "hardware",   // Hardware refresh cycles align with fiscal year
  "security",   // Security audits often happen end of year
  "compliance", // Compliance deadlines
]);

/** Product types that get Q4 boost */
const Q4_BOOST_TYPES = new Set(["hardware", "service"]);

/**
 * Computes a seasonal boost factor.
 * Q4 (October-December) is budget season — hardware and security purchases spike.
 * Returns 1.0 (no boost) to 1.25 (Q4 peak for matching categories).
 */
export function computeSeasonalFactor(
  product: Product,
  categoryName: string,
  now: Date = new Date()
): number {
  const month = now.getMonth(); // 0-indexed: 9=Oct, 10=Nov, 11=Dec

  // Q4 boost
  if (month >= 9 && month <= 11) {
    const categoryLower = categoryName.toLowerCase();
    const isQ4Category = Array.from(Q4_BOOST_CATEGORIES).some((cat) =>
      categoryLower.includes(cat)
    );
    const isQ4Type = Q4_BOOST_TYPES.has(product.type);

    if (isQ4Category || isQ4Type) return 1.25;
    return 1.1; // Slight boost for all products in Q4 (budget allocation)
  }

  // Q1 (January-March): slight boost for new year resolutions/planning
  if (month >= 0 && month <= 2) {
    return 1.05;
  }

  return 1.0;
}

// ── Cross-sell Rules ───────────────────────────────────────────────

export type CrossSellResult = {
  product: Product;
  coOccurrenceRate: number;
  description: string;
};

/**
 * Discovers cross-sell opportunities: "Customers who bought X also bought Y".
 * Analyzes co-occurrence of products across all companies.
 * Only returns products the target company doesn't already own.
 */
export function computeCrossSells(
  companyClientProducts: ClientProduct[],
  allClientProducts: ClientProduct[],
  allProducts: Product[],
  minCoOccurrence: number = 0.5
): CrossSellResult[] {
  const ownedProductIds = new Set(
    companyClientProducts.map((cp) => cp.product_id)
  );

  if (ownedProductIds.size === 0) return [];

  const productMap = new Map(allProducts.map((p) => [p.id, p]));

  // Build company → products mapping
  const companyProducts = new Map<string, Set<string>>();
  for (const cp of allClientProducts) {
    const existing = companyProducts.get(cp.company_id);
    if (existing) {
      existing.add(cp.product_id);
    } else {
      companyProducts.set(cp.company_id, new Set([cp.product_id]));
    }
  }

  // For each owned product, find what other products co-occur
  const coOccurrence = new Map<string, number>();
  const ownerCounts = new Map<string, number>();

  for (const ownedId of Array.from(ownedProductIds)) {
    // Count how many other companies also own this product
    let companiesWithProduct = 0;

    for (const [, products] of Array.from(companyProducts.entries())) {
      if (!products.has(ownedId)) continue;
      companiesWithProduct++;

      // Count co-occurring products
      for (const otherProductId of Array.from(products)) {
        if (ownedProductIds.has(otherProductId)) continue; // Skip already owned
        coOccurrence.set(
          otherProductId,
          (coOccurrence.get(otherProductId) ?? 0) + 1
        );
      }
    }

    // Track denominator per owned product
    for (const [productId] of Array.from(coOccurrence.entries())) {
      if (!ownerCounts.has(productId)) {
        ownerCounts.set(productId, companiesWithProduct);
      }
    }
  }

  const results: CrossSellResult[] = [];

  for (const [productId, count] of Array.from(coOccurrence.entries())) {
    const denominator = ownerCounts.get(productId) ?? 1;
    const rate = count / denominator;

    if (rate < minCoOccurrence) continue;

    const product = productMap.get(productId);
    if (!product || !product.is_active) continue;

    const percentage = Math.round(rate * 100);
    results.push({
      product,
      coOccurrenceRate: rate,
      description: `${percentage}% van klanten met vergelijkbare producten gebruikt ook ${product.name}`,
    });
  }

  results.sort((a, b) => b.coOccurrenceRate - a.coOccurrenceRate);
  return results;
}

// ── Confidence Calculation ─────────────────────────────────────────

export type ConfidenceFactors = {
  /** From pattern matching segment size */
  segmentConfidence: number;
  /** From feedback data volume (0-1) */
  dataConfidence: number;
  /** From gap analysis (1.0 for gap-based, lower for pattern-only) */
  sourceConfidence: number;
  /** Combined confidence score */
  overall: number;
};

/**
 * Computes confidence for a recommendation based on multiple factors.
 * Returns overall confidence between 0 and 1.
 */
export function computeConfidence(
  hasGap: boolean,
  segmentSize: number,
  feedbackCount: number,
  adoptionRate: number | null
): ConfidenceFactors {
  // Gap-based recommendations are inherently high confidence
  const sourceConfidence = hasGap ? 0.9 : 0.5;

  // Segment confidence: more peers = more reliable pattern
  const segmentConfidence =
    segmentSize >= 20
      ? 1.0
      : segmentSize >= 10
        ? 0.8
        : segmentSize >= 5
          ? 0.6
          : Math.max(0.3, segmentSize / 10);

  // Data confidence: more feedback = more reliable learning signal
  const dataConfidence = Math.min(feedbackCount / 100, 1.0);

  // Adoption rate boost
  const adoptionBoost = adoptionRate !== null ? adoptionRate * 0.2 : 0;

  // Gap-based recommendations get a higher base floor since they come from
  // real dependency analysis, not statistical patterns
  const baseFloor = hasGap ? 0.2 : 0.15;

  const overall = Math.min(
    1.0,
    sourceConfidence * 0.5 +
      segmentConfidence * 0.25 +
      dataConfidence * 0.1 +
      adoptionBoost +
      baseFloor
  );

  return {
    segmentConfidence,
    dataConfidence,
    sourceConfidence,
    overall: Math.round(overall * 100) / 100,
  };
}

// ── A/B Test Framework ─────────────────────────────────────────────

export type ABVariant = "control" | "weighted_v2" | "seasonal" | "personalized";

export type ABAssignment = {
  variant: ABVariant;
  experimentId: string;
};

/**
 * Deterministically assigns a company to an A/B test variant.
 * Uses company ID hash for consistent assignment.
 */
export function assignVariant(
  companyId: string,
  experimentId: string
): ABAssignment {
  // Simple deterministic hash: sum of char codes modulo variant count
  const variants: ABVariant[] = [
    "control",
    "weighted_v2",
    "seasonal",
    "personalized",
  ];
  let hash = 0;
  const combined = `${companyId}:${experimentId}`;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % variants.length;
  const variant = variants[index];

  return {
    variant: variant ?? "control",
    experimentId,
  };
}

/**
 * Determines if specific scoring features should be enabled based on variant.
 */
export function getVariantFeatures(variant: ABVariant): {
  useWeightedScoring: boolean;
  useSeasonalBoost: boolean;
  usePersonalization: boolean;
  useCrossSell: boolean;
} {
  switch (variant) {
    case "control":
      return {
        useWeightedScoring: false,
        useSeasonalBoost: false,
        usePersonalization: false,
        useCrossSell: false,
      };
    case "weighted_v2":
      return {
        useWeightedScoring: true,
        useSeasonalBoost: true,
        usePersonalization: false,
        useCrossSell: true,
      };
    case "seasonal":
      return {
        useWeightedScoring: true,
        useSeasonalBoost: true,
        usePersonalization: false,
        useCrossSell: false,
      };
    case "personalized":
      return {
        useWeightedScoring: true,
        useSeasonalBoost: true,
        usePersonalization: true,
        useCrossSell: true,
      };
  }
}

// ── Personalization ────────────────────────────────────────────────

/**
 * Computes category preference weights based on user's past feedback.
 * Categories where the user previously clicked/contacted get a boost.
 * Returns a map of categoryName → boost multiplier (1.0-1.5).
 */
export function computeCategoryPreferences(
  feedbackActions: Array<{
    productId: string;
    action: string;
    categoryId: string;
  }>,
  categoryMap: Map<string, string>
): Map<string, number> {
  const categoryClicks = new Map<string, number>();
  const categoryShown = new Map<string, number>();

  for (const fb of feedbackActions) {
    const categoryName = categoryMap.get(fb.categoryId) ?? "Overig";

    if (fb.action === "shown") {
      categoryShown.set(
        categoryName,
        (categoryShown.get(categoryName) ?? 0) + 1
      );
    } else if (
      fb.action === "clicked" ||
      fb.action === "contacted" ||
      fb.action === "purchased"
    ) {
      categoryClicks.set(
        categoryName,
        (categoryClicks.get(categoryName) ?? 0) + 1
      );
    }
  }

  const preferences = new Map<string, number>();

  for (const [category, clicks] of Array.from(categoryClicks.entries())) {
    const shown = categoryShown.get(category) ?? 1;
    const engagementRate = clicks / shown;

    // Scale: 0% engagement → 1.0, 50%+ engagement → 1.5
    const boost = 1.0 + Math.min(engagementRate, 0.5) * 1.0;
    preferences.set(category, Math.round(boost * 100) / 100);
  }

  return preferences;
}

/**
 * Applies personalization boost to a recommendation score.
 */
export function applyPersonalizationBoost(
  baseScore: number,
  category: string,
  preferences: Map<string, number>
): number {
  const boost = preferences.get(category) ?? 1.0;
  return Math.round(baseScore * boost);
}
