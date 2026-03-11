// Realistic mock prices for 30+ products across distributors
import type { DistributorPrice } from "./types";

const now = new Date().toISOString();

export const MOCK_PRICES: DistributorPrice[] = [
  // Cybersecurity
  { sku: "FG-60F", distributor: "copaco", price: 489.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "FG-60F", distributor: "ingram", price: 495.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "FG-60F", distributor: "td-synnex", price: 492.00, currency: "EUR", availability: "limited", updated_at: now },
  { sku: "FG-80F", distributor: "copaco", price: 1289.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "FG-80F", distributor: "ingram", price: 1295.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "FG-100F", distributor: "copaco", price: 2450.00, currency: "EUR", availability: "limited", updated_at: now },
  { sku: "FG-100F", distributor: "td-synnex", price: 2395.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "WG-T45", distributor: "copaco", price: 649.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "WG-T45", distributor: "ingram", price: 659.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "CS-EPP-25", distributor: "ingram", price: 875.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "CS-EPP-25", distributor: "td-synnex", price: 862.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "VBR-365", distributor: "copaco", price: 329.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "VBR-365", distributor: "ingram", price: 335.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "VBR-365", distributor: "td-synnex", price: 332.00, currency: "EUR", availability: "in_stock", updated_at: now },

  // Devices
  { sku: "HP-EB850G10", distributor: "copaco", price: 1249.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "HP-EB850G10", distributor: "ingram", price: 1265.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "HP-EB850G10", distributor: "td-synnex", price: 1255.00, currency: "EUR", availability: "limited", updated_at: now },
  { sku: "LN-T14SG4", distributor: "copaco", price: 1189.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "LN-T14SG4", distributor: "ingram", price: 1195.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "DL-LAT5540", distributor: "td-synnex", price: 1089.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "DL-LAT5540", distributor: "copaco", price: 1095.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "HP-DL380G11", distributor: "ingram", price: 4895.00, currency: "EUR", availability: "on_order", updated_at: now },
  { sku: "HP-DL380G11", distributor: "td-synnex", price: 4850.00, currency: "EUR", availability: "limited", updated_at: now },
  { sku: "SM-27UHD", distributor: "copaco", price: 389.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "SM-27UHD", distributor: "ingram", price: 395.00, currency: "EUR", availability: "in_stock", updated_at: now },

  // Cloud & Software
  { sku: "MS-M365-BP", distributor: "td-synnex", price: 11.70, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "MS-M365-BP", distributor: "ingram", price: 11.70, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "MS-MFA", distributor: "td-synnex", price: 5.40, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "MS-AZ-RES", distributor: "ingram", price: 0, currency: "EUR", availability: "in_stock", updated_at: now },

  // Connectivity
  { sku: "CS-MR36", distributor: "copaco", price: 789.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "CS-MR36", distributor: "ingram", price: 795.00, currency: "EUR", availability: "limited", updated_at: now },
  { sku: "CS-MS225", distributor: "copaco", price: 1450.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "CS-MS225", distributor: "td-synnex", price: 1439.00, currency: "EUR", availability: "in_stock", updated_at: now },

  // Mobile
  { sku: "MDM-01", distributor: "ingram", price: 4.50, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "MDM-01", distributor: "td-synnex", price: 4.50, currency: "EUR", availability: "in_stock", updated_at: now },

  // Managed Services (license-based)
  { sku: "MON-RMM", distributor: "ingram", price: 3.50, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "PATCH-MGR", distributor: "ingram", price: 2.80, currency: "EUR", availability: "in_stock", updated_at: now },

  // Pro AV
  { sku: "POLY-X50", distributor: "copaco", price: 2890.00, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "POLY-X50", distributor: "td-synnex", price: 2850.00, currency: "EUR", availability: "limited", updated_at: now },

  // AI
  { sku: "MS-COPILOT", distributor: "td-synnex", price: 28.10, currency: "EUR", availability: "in_stock", updated_at: now },
  { sku: "MS-COPILOT", distributor: "ingram", price: 28.10, currency: "EUR", availability: "in_stock", updated_at: now },
];

/**
 * Get mock prices for a specific SKU.
 */
export function getMockPrices(sku: string): DistributorPrice[] {
  return MOCK_PRICES.filter((p) => p.sku === sku);
}

/**
 * Search mock prices by query (matches against SKU).
 */
export function searchMockPrices(query: string): DistributorPrice[] {
  const lower = query.toLowerCase();
  return MOCK_PRICES.filter((p) => p.sku.toLowerCase().includes(lower));
}
