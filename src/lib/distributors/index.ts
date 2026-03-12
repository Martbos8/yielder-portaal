// Distributor pricing — aggregates prices from all distributors
// Check DB cache first, then API, then mock fallback
import { CopacoClient } from "./copaco";
import { IngramClient } from "./ingram";
import { TDSynnexClient } from "./td-synnex";
import { getMockPrices } from "./mock-prices";
import type { DistributorPrice, PriceResult } from "./types";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const distributors = [
  new CopacoClient(),
  new IngramClient(),
  new TDSynnexClient(),
];

// In-memory cache for prices
const priceCache = new Map<string, { prices: DistributorPrice[]; fetchedAt: number }>();

/**
 * Check the distributor_prices DB table for cached prices.
 * Returns cached prices if less than 24h old, otherwise null.
 */
async function getDbCachedPrices(sku: string): Promise<DistributorPrice[] | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();

    const { data } = await supabase
      .from("distributor_prices")
      .select("sku, distributor, price, currency, availability, updated_at")
      .eq("sku", sku)
      .gte("updated_at", cutoff);

    if (data && data.length > 0) {
      return data as DistributorPrice[];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save prices to the distributor_prices DB table for caching.
 */
async function saveDbPrices(prices: DistributorPrice[]): Promise<void> {
  if (prices.length === 0) return;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    await supabase.from("distributor_prices").upsert(
      prices.map((p) => ({
        sku: p.sku,
        distributor: p.distributor,
        price: p.price,
        currency: p.currency,
        availability: p.availability,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "sku,distributor" }
    );
  } catch {
    // Silent fail — caching should never break pricing
  }
}

/**
 * Gets prices for a product SKU from all distributors.
 * Priority: 1) In-memory cache 2) DB cache 3) API calls 4) Mock fallback
 * NEVER returns an error to frontend — always returns a price.
 */
export async function getPricesForSku(sku: string): Promise<DistributorPrice[]> {
  // 1. In-memory cache
  const memCached = priceCache.get(sku);
  if (memCached && Date.now() - memCached.fetchedAt < CACHE_TTL_MS) {
    return memCached.prices;
  }

  // 2. DB cache
  const dbCached = await getDbCachedPrices(sku);
  if (dbCached) {
    priceCache.set(sku, { prices: dbCached, fetchedAt: Date.now() });
    return dbCached;
  }

  // 3. Try API calls
  try {
    const pricePromises = distributors.map((d) => d.getPrice(sku));
    const results = await Promise.all(pricePromises);
    const prices = results.filter((p): p is DistributorPrice => p !== null);

    if (prices.length > 0) {
      priceCache.set(sku, { prices, fetchedAt: Date.now() });
      await saveDbPrices(prices);
      return prices;
    }
  } catch {
    // API failed — fall through to mock
  }

  // 4. Mock fallback — always returns something
  const mockPrices = getMockPrices(sku);
  if (mockPrices.length > 0) {
    priceCache.set(sku, { prices: mockPrices, fetchedAt: Date.now() });
    return mockPrices;
  }

  return [];
}

/**
 * Gets the best (lowest) price for a product SKU across all distributors.
 * Checks DB cache first, then API, then mock. Never errors.
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
  priceCache.clear();
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
