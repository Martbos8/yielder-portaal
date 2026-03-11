/**
 * Cached repository layer — wraps raw repository functions with in-memory caching.
 *
 * Use these in Server Components for data that doesn't need real-time freshness.
 * Use the raw repository functions when you need guaranteed fresh data
 * (e.g., after a mutation).
 */
import { cached, CacheTTL, cache } from "@/lib/cache";
import {
  getActiveProducts,
  getProductCategories,
  getProductDependencies,
  getClientProducts,
} from "./product.repository";
import {
  getUserCompany,
  getUserCompanyId,
  getDashboardStats,
} from "./company.repository";
import {
  getRecommendations,
  type Recommendation,
} from "@/lib/engine/recommendation";
import type {
  Product,
  ProductCategory,
  ProductDependency,
  ClientProduct,
  Company,
  DashboardStats,
} from "@/types/database";

// ─── Product cache (1 hour TTL — catalogue changes infrequently) ─────────

export function getCachedActiveProducts(): Promise<Product[]> {
  return cached("products:active", CacheTTL.HOUR, getActiveProducts);
}

export function getCachedProductCategories(): Promise<ProductCategory[]> {
  return cached("products:categories", CacheTTL.HOUR, getProductCategories);
}

export function getCachedProductDependencies(): Promise<ProductDependency[]> {
  return cached("products:dependencies", CacheTTL.HOUR, getProductDependencies);
}

// ─── Client products cache (5 min TTL — per company) ─────────────────────

export function getCachedClientProducts(companyId: string): Promise<ClientProduct[]> {
  return cached(
    `client-products:${companyId}`,
    CacheTTL.MEDIUM,
    () => getClientProducts(companyId),
  );
}

// ─── Company cache (30 min TTL) ──────────────────────────────────────────

export function getCachedUserCompany(): Promise<Company | null> {
  // Keyed by a static key since getUserCompany resolves user from auth
  return cached("company:current-user", CacheTTL.LONG, getUserCompany);
}

export function getCachedUserCompanyId(): Promise<string | null> {
  return cached("company:current-user-id", CacheTTL.LONG, getUserCompanyId);
}

// ─── Dashboard stats cache (2 min TTL — frequently viewed, aggregated) ───

export function getCachedDashboardStats(): Promise<DashboardStats> {
  return cached("dashboard:stats", CacheTTL.SHORT, getDashboardStats);
}

// ─── Recommendations cache (5 min TTL — per company) ─────────────────────

export function getCachedRecommendations(companyId: string): Promise<Recommendation[]> {
  return cached(
    `recommendations:${companyId}`,
    CacheTTL.MEDIUM,
    () => getRecommendations(companyId),
  );
}

// ─── Cache invalidation helpers ──────────────────────────────────────────

/** Invalidate all product-related caches. */
export function invalidateProductCache(): void {
  cache.invalidate("products:*");
  cache.invalidate("client-products:*");
}

/** Invalidate company-related caches. */
export function invalidateCompanyCache(): void {
  cache.invalidate("company:*");
}

/** Invalidate dashboard stats cache. */
export function invalidateDashboardCache(): void {
  cache.invalidate("dashboard:*");
}

/** Invalidate all caches (e.g., after a sync). */
export function invalidateAllCaches(): void {
  cache.clear();
}
