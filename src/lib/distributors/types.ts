// Distributor pricing types

export type DistributorName = "copaco" | "ingram" | "td-synnex" | "esprinet";

export type DistributorPrice = {
  sku: string;
  distributor: DistributorName;
  price: number;
  currency: string;
  availability: "in_stock" | "limited" | "out_of_stock" | "on_order";
  updated_at: string;
};

export type PriceResult = {
  product_id: string;
  prices: DistributorPrice[];
  bestPrice: DistributorPrice | null;
};
