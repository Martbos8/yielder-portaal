import { createClient } from "@/lib/supabase/server";
import type {
  Product,
  ProductDependency,
  ClientProduct,
  DependencyType,
} from "@/types/database";

export type GapSeverity = "critical" | "warning" | "info";

export type GapResult = {
  missingProduct: Product;
  reason: string;
  severity: GapSeverity;
  relatedTo: Product;
};

// Products that are critical to have — missing these = red alert
const CRITICAL_SKUS = new Set([
  "VBR-365", // Cloud Backup
  "VBR-STD", // Backup & Replicatie
  "FG-60F", // Firewall (FortiGate)
  "WG-T45", // Firewall (WatchGuard)
  "FC-EP-100", // Endpoint Protection
  "MS-MFA", // Multi-Factor Authenticatie
]);

/**
 * Determines gap severity based on the dependency type and the missing product.
 *
 * CRITICAL: missing backup, firewall, antivirus, MFA
 * WARNING: missing MDM, managed service, or other "recommended" dependencies
 * INFO: missing "enhances" dependencies (nice-to-have upgrades)
 */
function determineSeverity(
  dependencyType: DependencyType,
  missingProductSku: string | null
): GapSeverity {
  if (
    dependencyType === "requires" &&
    missingProductSku &&
    CRITICAL_SKUS.has(missingProductSku)
  ) {
    return "critical";
  }

  if (dependencyType === "requires") {
    return "warning";
  }

  if (dependencyType === "recommended") {
    return "warning";
  }

  // "enhances"
  return "info";
}

/**
 * Generates a human-readable reason for the gap.
 */
function generateReason(
  relatedProduct: Product,
  missingProduct: Product,
  dependencyType: DependencyType
): string {
  switch (dependencyType) {
    case "requires":
      return `${relatedProduct.name} vereist ${missingProduct.name} voor adequate bescherming`;
    case "recommended":
      return `${missingProduct.name} wordt sterk aanbevolen bij gebruik van ${relatedProduct.name}`;
    case "enhances":
      return `${missingProduct.name} verbetert de werking van ${relatedProduct.name}`;
  }
}

/**
 * Analyzes gaps in a company's IT portfolio by comparing owned products
 * against the product dependency graph. Returns missing products sorted
 * by severity (critical first).
 */
export async function analyzeGaps(companyId: string): Promise<GapResult[]> {
  const supabase = await createClient();

  // Fetch all data in parallel
  const [clientProductsRes, dependenciesRes, productsRes] = await Promise.all([
    supabase
      .from("client_products")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "active"),
    supabase.from("product_dependencies").select("*"),
    supabase.from("products").select("*").eq("is_active", true),
  ]);

  const clientProducts = (clientProductsRes.data ?? []) as ClientProduct[];
  const dependencies = (dependenciesRes.data ?? []) as ProductDependency[];
  const allProducts = (productsRes.data ?? []) as Product[];

  return computeGaps(clientProducts, dependencies, allProducts);
}

/**
 * Pure function that computes gaps — extracted for testability.
 */
export function computeGaps(
  clientProducts: ClientProduct[],
  dependencies: ProductDependency[],
  allProducts: Product[]
): GapResult[] {
  // Set of product IDs the company owns
  const ownedProductIds = new Set(clientProducts.map((cp) => cp.product_id));

  // Map product IDs to full product objects for lookup
  const productMap = new Map(allProducts.map((p) => [p.id, p]));

  const gaps: GapResult[] = [];
  const seenMissing = new Set<string>();

  for (const dep of dependencies) {
    const ownsSource = ownedProductIds.has(dep.product_id);
    const ownsDependency = ownedProductIds.has(dep.depends_on_product_id);

    // If the company owns the source product but NOT the dependency → gap
    if (ownsSource && !ownsDependency) {
      const missingProduct = productMap.get(dep.depends_on_product_id);
      const relatedProduct = productMap.get(dep.product_id);

      if (!missingProduct || !relatedProduct) continue;

      // Avoid duplicates (same missing product from multiple sources — keep highest severity)
      const key = missingProduct.id;
      if (seenMissing.has(key)) continue;
      seenMissing.add(key);

      const severity = determineSeverity(
        dep.dependency_type,
        missingProduct.sku
      );

      gaps.push({
        missingProduct,
        reason: generateReason(relatedProduct, missingProduct, dep.dependency_type),
        severity,
        relatedTo: relatedProduct,
      });
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder: Record<GapSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return gaps;
}
