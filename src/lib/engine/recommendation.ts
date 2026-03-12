import { createClient } from "@/lib/supabase/server";
import type {
  Product,
  ProductDependency,
  ClientProduct,
  Company,
} from "@/types/database";
import { computeGaps, type GapResult, type GapSeverity } from "./gap-analysis";
import { computePatterns, type PatternResult } from "./pattern-matching";

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
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cache per companyId
const recommendationCache = new Map<
  string,
  { recommendations: Recommendation[]; fetchedAt: number }
>();

/**
 * Fetches all data and computes ranked recommendations for a company.
 * Returns [] on any error — never throws.
 * Results are cached for 5 minutes per companyId.
 */
export async function getRecommendations(
  companyId: string
): Promise<Recommendation[]> {
  // Check cache
  const cached = recommendationCache.get(companyId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.recommendations;
  }

  try {
    const supabase = await createClient();

    const [companyRes, companiesRes, clientProductsRes, productsRes, depsRes, categoriesRes] =
      await Promise.all([
        supabase.from("companies").select("id, name, employee_count, industry, region, created_at, updated_at").eq("id", companyId).single(),
        supabase.from("companies").select("id, name, employee_count, industry, region, created_at, updated_at"),
        supabase.from("client_products").select("id, company_id, product_id, quantity, purchase_date, expiry_date, status, created_at, updated_at").eq("status", "active"),
        supabase.from("products").select("id, category_id, name, vendor, sku, description, type, lifecycle_years, is_active, created_at, updated_at").eq("is_active", true),
        supabase.from("product_dependencies").select("id, product_id, depends_on_product_id, dependency_type, created_at"),
        supabase.from("product_categories").select("id, name"),
      ]);

    const company = companyRes.data as Company | null;
    if (!company) return [];

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

    const gaps = computeGapsSafe(companyClientProducts, dependencies, allProducts);
    const patterns = computePatternsSafe(company, allCompanies, allClientProducts, allProducts);

    const recommendations = computeRecommendations(gaps, patterns, categoryMap);

    // Cache the result
    recommendationCache.set(companyId, {
      recommendations,
      fetchedAt: Date.now(),
    });

    return recommendations;
  } catch {
    return [];
  }
}

/**
 * Safe wrapper around computeGaps — returns [] on error.
 */
function computeGapsSafe(
  clientProducts: ClientProduct[],
  dependencies: ProductDependency[],
  products: Product[]
): GapResult[] {
  try {
    return computeGaps(clientProducts, dependencies, products);
  } catch {
    return [];
  }
}

/**
 * Safe wrapper around computePatterns — returns [] on error.
 */
function computePatternsSafe(
  company: Company,
  allCompanies: Company[],
  allClientProducts: ClientProduct[],
  allProducts: Product[]
): PatternResult[] {
  try {
    return computePatterns(company, allCompanies, allClientProducts, allProducts);
  } catch {
    return [];
  }
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

/**
 * Clear the recommendation cache (useful for testing).
 */
export function clearRecommendationCache(): void {
  recommendationCache.clear();
}
