import { DistributorClient } from "./client";
import type { DistributorPrice, DistributorName } from "./types";
import { getMockPrices, searchMockPrices } from "./mock-prices";

export class CopacoClient extends DistributorClient {
  readonly name: DistributorName = "copaco";

  isConfigured(): boolean {
    return !!process.env['COPACO_API_KEY'];
  }

  async getPrice(sku: string): Promise<DistributorPrice | null> {
    if (!this.isConfigured()) {
      const prices = getMockPrices(sku).filter((p) => p.distributor === "copaco");
      return prices[0] ?? null;
    }

    // TODO: Implement real Copaco API call when API key is available
    return null;
  }

  async searchProducts(query: string): Promise<DistributorPrice[]> {
    if (!this.isConfigured()) {
      return searchMockPrices(query).filter((p) => p.distributor === "copaco");
    }

    // TODO: Implement real Copaco API search
    return [];
  }
}
