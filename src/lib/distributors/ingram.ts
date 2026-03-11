import { DistributorClient } from "./client";
import type { DistributorPrice, DistributorName } from "./types";
import { getMockPrices, searchMockPrices } from "./mock-prices";

export class IngramClient extends DistributorClient {
  readonly name: DistributorName = "ingram";

  isConfigured(): boolean {
    return !!process.env.INGRAM_API_KEY;
  }

  async getPrice(sku: string): Promise<DistributorPrice | null> {
    if (!this.isConfigured()) {
      const prices = getMockPrices(sku).filter((p) => p.distributor === "ingram");
      return prices[0] ?? null;
    }

    // TODO: Implement real Ingram Micro API call
    return null;
  }

  async searchProducts(query: string): Promise<DistributorPrice[]> {
    if (!this.isConfigured()) {
      return searchMockPrices(query).filter((p) => p.distributor === "ingram");
    }

    return [];
  }
}
