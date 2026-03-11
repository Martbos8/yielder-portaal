import { createClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import type {
  Product,
  ProductDependency,
  ClientProduct,
  Company,
} from "@/types/database";
import { computeGaps, type GapResult, type GapSeverity } from "./gap-analysis";
import { computePatterns, type PatternResult } from "./pattern-matching";

const log = createLogger("engine:recommendation");

export type Recommendation = {
  product: Product;
  score: number;
  reason: string;
  severity: GapSeverity | null;
  adoptionRate: number | null;
  category: string;
  ctaText: string;
};

const SEVERITY_WEIGHT: Record<GapSeverity, number> = {
  critical: 100,
  warning: 60,
  info: 20,
};

const MAX_RECOMMENDATIONS = 10;

/**
 * Fetches all data and computes ranked recommendations for a company.
 */
export async function getRecommendations(
  companyId: string
): Promise<Recommendation[]> {
  const supabase = await createClient();

  const [companyRes, companiesRes, clientProductsRes, productsRes, depsRes, categoriesRes] =
    await Promise.all([
      supabase.from("companies").select("*").eq("id", companyId).single(),
      supabase.from("companies").select("*"),
      supabase.from("client_products").select("*").eq("status", "active"),
      supabase.from("products").select("*").eq("is_active", true),
      supabase.from("product_dependencies").select("*"),
      supabase.from("product_categories").select("*"),
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

  const categoryMap = new Map(
    ((categoriesRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name])
  );

  // Filter client products for this company
  const companyClientProducts = allClientProducts.filter(
    (cp) => cp.company_id === companyId
  );

  const start = Date.now();
  const gaps = computeGaps(companyClientProducts, dependencies, allProducts);
  const patterns = computePatterns(company, allCompanies, allClientProducts, allProducts);
  const recommendations = computeRecommendations(gaps, patterns, categoryMap);

  log.debug("Recommendations computed", {
    companyId,
    gaps: gaps.length,
    patterns: patterns.length,
    recommendations: recommendations.length,
    durationMs: Date.now() - start,
  });

  return recommendations;
}

/**
 * Pure function that combines gap analysis and pattern matching results
 * into a single ranked list of recommendations.
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
    });
  }

  // Process pattern results — merge if same product already exists from gaps
  for (const pattern of patterns) {
    const productId = pattern.product.id;
    const adoptionBonus = Math.round(pattern.adoptionRate * 40);
    const existing = recommendationMap.get(productId);

    if (existing) {
      // Merge: add adoption bonus to existing gap score
      existing.score += adoptionBonus;
      existing.adoptionRate = pattern.adoptionRate;
      // Enrich reason with adoption info
      existing.reason += `. ${pattern.segmentDescription}`;
    } else {
      // New recommendation from pattern only
      recommendationMap.set(productId, {
        product: pattern.product,
        score: adoptionBonus,
        reason: pattern.segmentDescription,
        severity: null,
        adoptionRate: pattern.adoptionRate,
        category: categoryMap.get(pattern.product.category_id) ?? "Overig",
        ctaText: "Neem contact op met het team",
      });
    }
  }

  // Sort by score DESC, take top MAX_RECOMMENDATIONS
  const sorted = Array.from(recommendationMap.values()).sort(
    (a, b) => b.score - a.score
  );

  return sorted.slice(0, MAX_RECOMMENDATIONS);
}
