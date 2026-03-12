// Refresh distributor prices for all active products
// Idempotent: re-fetching the same prices simply overwrites the cache

import { createLogger } from "@/lib/logger";
import type { JobResult } from "./types";

const log = createLogger("job:price-refresher");

/**
 * Refreshes distributor prices for all active products with a SKU.
 * Fetches prices from all configured distributors and updates the cache.
 */
export async function runPriceRefresher(): Promise<JobResult> {
  const start = Date.now();

  log.info("Price refresher started");

  try {
    const { getActiveProducts } = await import("@/lib/repositories/product.repository");
    const { clearPriceCache } = await import("@/lib/distributors");
    const { getPricesForSku } = await import("@/lib/distributors");

    // Clear stale cache first
    clearPriceCache();

    const products = await getActiveProducts();
    const productsWithSku = products.filter((p) => p.sku);

    let refreshed = 0;
    let errors = 0;

    // Process in batches of 5 to avoid overwhelming distributor APIs
    const BATCH_SIZE = 5;
    for (let i = 0; i < productsWithSku.length; i += BATCH_SIZE) {
      const batch = productsWithSku.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((product) => getPricesForSku(product.sku!))
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          refreshed++;
        } else {
          errors++;
          log.warn("Failed to refresh price for product", {
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }
      }
    }

    const duration_ms = Date.now() - start;

    log.info("Price refresher completed", {
      refreshed,
      errors,
      totalProducts: productsWithSku.length,
      durationMs: duration_ms,
    });

    return {
      job: "refresh-prices",
      success: errors === 0,
      duration_ms,
      details: {
        totalProducts: productsWithSku.length,
        refreshed,
        errors,
      },
    };
  } catch (error) {
    const duration_ms = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);

    log.error("Price refresher failed", { error, durationMs: duration_ms });

    return {
      job: "refresh-prices",
      success: false,
      duration_ms,
      details: {},
      error: message,
    };
  }
}
