// Base distributor client — extended by each distributor
import type { DistributorPrice, DistributorName } from "./types";

export abstract class DistributorClient {
  abstract readonly name: DistributorName;

  /**
   * Returns true if API credentials are configured for this distributor.
   */
  abstract isConfigured(): boolean;

  /**
   * Gets the price for a specific SKU.
   */
  abstract getPrice(sku: string): Promise<DistributorPrice | null>;

  /**
   * Searches for products matching a query.
   */
  abstract searchProducts(query: string): Promise<DistributorPrice[]>;
}
