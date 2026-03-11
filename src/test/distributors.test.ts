import { describe, it, expect, beforeEach } from "vitest";
import { findBestPrice, getBestPrice, clearPriceCache, getDistributorStatus } from "@/lib/distributors";
import { getMockPrices, searchMockPrices } from "@/lib/distributors/mock-prices";
import { CopacoClient } from "@/lib/distributors/copaco";
import { IngramClient } from "@/lib/distributors/ingram";
import { TDSynnexClient } from "@/lib/distributors/td-synnex";
import type { DistributorPrice } from "@/lib/distributors/types";

describe("Distributor Pricing", () => {
  beforeEach(() => {
    clearPriceCache();
  });

  describe("findBestPrice", () => {
    it("returns lowest price from available options", () => {
      const prices: DistributorPrice[] = [
        { sku: "FG-60F", distributor: "copaco", price: 489, currency: "EUR", availability: "in_stock", updated_at: "" },
        { sku: "FG-60F", distributor: "ingram", price: 495, currency: "EUR", availability: "in_stock", updated_at: "" },
        { sku: "FG-60F", distributor: "td-synnex", price: 492, currency: "EUR", availability: "limited", updated_at: "" },
      ];
      const best = findBestPrice(prices);
      expect(best?.price).toBe(489);
      expect(best?.distributor).toBe("copaco");
    });

    it("excludes out_of_stock items", () => {
      const prices: DistributorPrice[] = [
        { sku: "X", distributor: "copaco", price: 100, currency: "EUR", availability: "out_of_stock", updated_at: "" },
        { sku: "X", distributor: "ingram", price: 200, currency: "EUR", availability: "in_stock", updated_at: "" },
      ];
      const best = findBestPrice(prices);
      expect(best?.price).toBe(200);
    });

    it("excludes on_order items", () => {
      const prices: DistributorPrice[] = [
        { sku: "X", distributor: "copaco", price: 100, currency: "EUR", availability: "on_order", updated_at: "" },
        { sku: "X", distributor: "ingram", price: 300, currency: "EUR", availability: "limited", updated_at: "" },
      ];
      const best = findBestPrice(prices);
      expect(best?.price).toBe(300);
    });

    it("returns null when no available prices", () => {
      const prices: DistributorPrice[] = [
        { sku: "X", distributor: "copaco", price: 100, currency: "EUR", availability: "out_of_stock", updated_at: "" },
      ];
      expect(findBestPrice(prices)).toBeNull();
    });

    it("returns null for empty array", () => {
      expect(findBestPrice([])).toBeNull();
    });
  });

  describe("Mock prices", () => {
    it("returns prices for known SKU", () => {
      const prices = getMockPrices("FG-60F");
      expect(prices.length).toBeGreaterThanOrEqual(2);
      expect(prices.every((p) => p.sku === "FG-60F")).toBe(true);
    });

    it("returns empty for unknown SKU", () => {
      expect(getMockPrices("UNKNOWN-SKU")).toHaveLength(0);
    });

    it("searches by partial SKU", () => {
      const results = searchMockPrices("FG-");
      expect(results.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("getBestPrice (with mock data)", () => {
    it("returns best price for known SKU from mock data", async () => {
      const best = await getBestPrice("FG-60F");
      expect(best).not.toBeNull();
      expect(best!.price).toBe(489);
      expect(best!.distributor).toBe("copaco");
    });

    it("returns null for unknown SKU", async () => {
      const best = await getBestPrice("UNKNOWN");
      expect(best).toBeNull();
    });
  });

  describe("Distributor clients", () => {
    it("Copaco returns mock data when not configured", async () => {
      const client = new CopacoClient();
      expect(client.isConfigured()).toBe(false);
      const price = await client.getPrice("FG-60F");
      expect(price).not.toBeNull();
      expect(price!.distributor).toBe("copaco");
    });

    it("Ingram returns mock data when not configured", async () => {
      const client = new IngramClient();
      expect(client.isConfigured()).toBe(false);
      const price = await client.getPrice("FG-60F");
      expect(price).not.toBeNull();
      expect(price!.distributor).toBe("ingram");
    });

    it("TD Synnex returns mock data when not configured", async () => {
      const client = new TDSynnexClient();
      expect(client.isConfigured()).toBe(false);
      const price = await client.getPrice("FG-60F");
      expect(price).not.toBeNull();
      expect(price!.distributor).toBe("td-synnex");
    });
  });

  describe("getDistributorStatus", () => {
    it("returns status for all distributors", () => {
      const status = getDistributorStatus();
      expect(status).toHaveLength(3);
      expect(status.map((s) => s.name)).toContain("copaco");
      expect(status.map((s) => s.name)).toContain("ingram");
      expect(status.map((s) => s.name)).toContain("td-synnex");
      // All should be unconfigured in test environment
      expect(status.every((s) => !s.configured)).toBe(true);
    });
  });
});
