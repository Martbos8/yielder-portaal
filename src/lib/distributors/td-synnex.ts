import { DistributorClient } from "./client";
import type { DistributorPrice, DistributorName } from "./types";
import { getMockPrices, searchMockPrices } from "./mock-prices";

export class TDSynnexClient extends DistributorClient {
  readonly name: DistributorName = "td-synnex";

  isConfigured(): boolean {
    return !!process.env.TDSYNNEX_API_KEY;
  }

  async getPrice(sku: string): Promise<DistributorPrice | null> {
    if (!this.isConfigured()) {
      const prices = getMockPrices(sku).filter((p) => p.distributor === "td-synnex");
      return prices[0] ?? null;
    }

    // TODO: Implement real TD Synnex API call
    return null;
  }

  async searchProducts(query: string): Promise<DistributorPrice[]> {
    if (!this.isConfigured()) {
      return searchMockPrices(query).filter((p) => p.distributor === "td-synnex");
    }

    return [];
  }
}
