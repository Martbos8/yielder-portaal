// Distributor pricing — aggregates prices from all distributors
import { CopacoClient } from "./copaco";
import { IngramClient } from "./ingram";
import { TDSynnexClient } from "./td-synnex";
import { cached as cachedFn, CacheTTL, cache } from "@/lib/cache";
import type { DistributorPrice, PriceResult } from "./types";

const distributors = [
  new CopacoClient(),
  new IngramClient(),
  new TDSynnexClient(),
];

/**
 * Gets prices for a product SKU from all distributors.
 * Caches results for 24 hours.
 */
export async function getPricesForSku(sku: string): Promise<DistributorPrice[]> {
  return cachedFn(`distributor-price:${sku}`, CacheTTL.DAY, async () => {
    const pricePromises = distributors.map((d) => d.getPrice(sku));
    const results = await Promise.all(pricePromises);
    return results.filter((p): p is DistributorPrice => p !== null);
  });
}

/**
 * Gets the best (lowest) price for a product SKU across all distributors.
 */
export async function getBestPrice(sku: string): Promise<DistributorPrice | null> {
  const prices = await getPricesForSku(sku);
  return findBestPrice(prices);
}

/**
 * Gets prices for a product by product_id, using the product's SKU.
 */
export async function getBestPriceForProduct(productSku: string): Promise<PriceResult> {
  const prices = await getPricesForSku(productSku);

  return {
    product_id: productSku,
    prices,
    bestPrice: findBestPrice(prices),
  };
}

/**
 * Pure function: finds the lowest price from a list of distributor prices.
 * Only considers in_stock or limited availability.
 */
export function findBestPrice(prices: DistributorPrice[]): DistributorPrice | null {
  const available = prices.filter(
    (p) => p.availability === "in_stock" || p.availability === "limited"
  );

  if (available.length === 0) return null;

  return available.reduce((best, current) =>
    current.price < best.price ? current : best
  );
}

/**
 * Clears the price cache (useful for testing or manual refresh).
 */
export function clearPriceCache(): void {
  cache.invalidate("distributor-price:*");
}

/**
 * Returns the configuration status of each distributor.
 */
export function getDistributorStatus(): { name: string; configured: boolean }[] {
  return distributors.map((d) => ({
    name: d.name,
    configured: d.isConfigured(),
  }));
}
