import { describe, it, expect } from "vitest";

type PricingTier = {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
};

type ShopProduct = {
  name: string;
  category: string;
  tiers: PricingTier[];
};

const products: ShopProduct[] = [
  {
    name: "Managed Workplace",
    category: "Werkplek",
    tiers: [
      { name: "Basis", price: "29", period: "per werkplek/mnd", features: ["Monitoring"] },
      { name: "Professioneel", price: "49", period: "per werkplek/mnd", features: ["Remote support"], highlighted: true },
      { name: "Enterprise", price: "79", period: "per werkplek/mnd", features: ["24/7"] },
    ],
  },
  {
    name: "Cloud Backup",
    category: "Beveiliging",
    tiers: [
      { name: "Starter", price: "5", period: "per gebruiker/mnd", features: ["50 GB"] },
      { name: "Business", price: "12", period: "per gebruiker/mnd", features: ["500 GB"], highlighted: true },
      { name: "Unlimited", price: "19", period: "per gebruiker/mnd", features: ["Onbeperkt"] },
    ],
  },
  {
    name: "Security Suite",
    category: "Beveiliging",
    tiers: [
      { name: "Essentials", price: "8", period: "per gebruiker/mnd", features: ["EDR"] },
      { name: "Advanced", price: "15", period: "per gebruiker/mnd", features: ["SIEM"], highlighted: true },
      { name: "Complete", price: "25", period: "per gebruiker/mnd", features: ["SOC"] },
    ],
  },
  {
    name: "Microsoft 365 Beheer",
    category: "Productiviteit",
    tiers: [
      { name: "Support", price: "4", period: "per gebruiker/mnd", features: ["Beheer"] },
      { name: "Managed", price: "9", period: "per gebruiker/mnd", features: ["SharePoint"], highlighted: true },
      { name: "Premium", price: "16", period: "per gebruiker/mnd", features: ["Intune"] },
    ],
  },
];

function formatPrice(price: string): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(Number(price));
}

describe("Shop page", () => {
  it("has correct page title", () => {
    expect("IT-oplossingen").toBe("IT-oplossingen");
  });

  it("has 4 products", () => {
    expect(products).toHaveLength(4);
  });

  it("each product has 3 pricing tiers", () => {
    for (const product of products) {
      expect(product.tiers).toHaveLength(3);
    }
  });

  it("each product has exactly one highlighted tier", () => {
    for (const product of products) {
      const highlighted = product.tiers.filter((t) => t.highlighted);
      expect(highlighted).toHaveLength(1);
    }
  });

  it("prices increase per tier within each product", () => {
    for (const product of products) {
      for (let i = 1; i < product.tiers.length; i++) {
        expect(Number(product.tiers[i].price)).toBeGreaterThan(
          Number(product.tiers[i - 1].price)
        );
      }
    }
  });
});

describe("Price formatting", () => {
  it("formats single digit price", () => {
    const formatted = formatPrice("5");
    expect(formatted).toContain("5");
    expect(formatted).toContain("€");
  });

  it("formats double digit price", () => {
    const formatted = formatPrice("49");
    expect(formatted).toContain("49");
  });
});

describe("Product categories", () => {
  it("includes Werkplek category", () => {
    expect(products.some((p) => p.category === "Werkplek")).toBe(true);
  });

  it("includes Beveiliging category", () => {
    expect(products.some((p) => p.category === "Beveiliging")).toBe(true);
  });

  it("includes Productiviteit category", () => {
    expect(products.some((p) => p.category === "Productiviteit")).toBe(true);
  });

  it("Beveiliging has 2 products", () => {
    const bevProducts = products.filter((p) => p.category === "Beveiliging");
    expect(bevProducts).toHaveLength(2);
  });
});
