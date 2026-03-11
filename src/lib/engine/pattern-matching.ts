import { createClient } from "@/lib/supabase/server";
import type {
  Company,
  CompanySize,
  Product,
  ClientProduct,
} from "@/types/database";

export type PatternResult = {
  product: Product;
  adoptionRate: number;
  segmentDescription: string;
  confidence: number;
};

/**
 * Determines company size segment based on employee count.
 */
export function getCompanySize(employeeCount: number | null): CompanySize {
  if (employeeCount === null) return "small";
  if (employeeCount < 20) return "small";
  if (employeeCount <= 100) return "medium";
  return "large";
}

function sizeLabel(size: CompanySize): string {
  switch (size) {
    case "small":
      return "kleine";
    case "medium":
      return "middelgrote";
    case "large":
      return "grote";
  }
}

/**
 * Checks whether two companies belong to the same segment.
 * Segments are based on size + industry (region is optional tiebreaker).
 */
function isSameSegment(a: Company, b: Company): boolean {
  const sameSize = getCompanySize(a.employee_count) === getCompanySize(b.employee_count);
  // If both have an industry, they must match; if either is null, match on size only
  const sameIndustry =
    !a.industry || !b.industry || a.industry === b.industry;
  return sameSize && sameIndustry;
}

/**
 * Analyzes product adoption patterns across companies in the same segment.
 * Returns products that are popular in the segment but missing for this company.
 */
export async function findPatterns(
  companyId: string
): Promise<PatternResult[]> {
  const supabase = await createClient();

  const [companyRes, companiesRes, clientProductsRes, productsRes] =
    await Promise.all([
      supabase.from("companies").select("*").eq("id", companyId).single(),
      supabase.from("companies").select("*"),
      supabase.from("client_products").select("*").eq("status", "active"),
      supabase.from("products").select("*").eq("is_active", true),
    ]);

  const company = companyRes.data as Company | null;
  if (!company) return [];

  const allCompanies = (companiesRes.data ?? []) as Company[];
  const allClientProducts = (clientProductsRes.data ?? []) as ClientProduct[];
  const allProducts = (productsRes.data ?? []) as Product[];

  return computePatterns(company, allCompanies, allClientProducts, allProducts);
}

/**
 * Pure function that computes patterns — extracted for testability.
 */
export function computePatterns(
  company: Company,
  allCompanies: Company[],
  allClientProducts: ClientProduct[],
  allProducts: Product[]
): PatternResult[] {
  // Find companies in the same segment (excluding this company)
  const segmentCompanies = allCompanies.filter(
    (c) => c.id !== company.id && isSameSegment(company, c)
  );

  if (segmentCompanies.length === 0) return [];

  const segmentCompanyIds = new Set(segmentCompanies.map((c) => c.id));

  // Products this company already owns
  const ownedProductIds = new Set(
    allClientProducts
      .filter((cp) => cp.company_id === company.id)
      .map((cp) => cp.product_id)
  );

  // Map product IDs to objects
  const productMap = new Map(allProducts.map((p) => [p.id, p]));

  // Count how many segment companies have each product
  const productAdoption = new Map<string, number>();
  for (const cp of allClientProducts) {
    if (!segmentCompanyIds.has(cp.company_id)) continue;
    productAdoption.set(
      cp.product_id,
      (productAdoption.get(cp.product_id) ?? 0) + 1
    );
  }

  const segmentCount = segmentCompanies.length;
  const companySize = getCompanySize(company.employee_count);

  const results: PatternResult[] = [];

  for (const [productId, count] of Array.from(productAdoption.entries())) {
    // Skip products the company already owns
    if (ownedProductIds.has(productId)) continue;

    const adoptionRate = count / segmentCount;

    // Only show if > 60% adoption
    if (adoptionRate <= 0.6) continue;

    const product = productMap.get(productId);
    if (!product) continue;

    const percentage = Math.round(adoptionRate * 100);
    const industryPart = company.industry
      ? ` in de ${company.industry}-sector`
      : "";
    const segmentDescription = `${percentage}% van vergelijkbare ${sizeLabel(companySize)} bedrijven${industryPart} gebruikt ${product.name}`;

    // Confidence increases with more data points (segment size)
    const confidence = Math.min(segmentCount / 10, 1);

    results.push({
      product,
      adoptionRate,
      segmentDescription,
      confidence,
    });
  }

  // Sort by adoption rate DESC
  results.sort((a, b) => b.adoptionRate - a.adoptionRate);

  return results;
}
