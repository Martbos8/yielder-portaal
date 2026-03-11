import { describe, it, expect } from "vitest";
import { computeGaps } from "@/lib/engine/gap-analysis";
import type {
  Product,
  ProductDependency,
  ClientProduct,
} from "@/types/database";

// Helper to create mock products
function mockProduct(overrides: Partial<Product> & { id: string; name: string }): Product {
  return {
    category_id: "cat-1",
    vendor: null,
    sku: null,
    description: null,
    type: "software",
    lifecycle_years: null,
    is_active: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  };
}

function mockDependency(
  productId: string,
  dependsOnId: string,
  type: "requires" | "recommended" | "enhances" = "requires"
): ProductDependency {
  return {
    id: `dep-${productId}-${dependsOnId}`,
    product_id: productId,
    depends_on_product_id: dependsOnId,
    dependency_type: type,
    created_at: "2026-01-01",
  };
}

function mockClientProduct(
  companyId: string,
  productId: string
): ClientProduct {
  return {
    id: `cp-${productId}`,
    company_id: companyId,
    product_id: productId,
    quantity: 1,
    purchase_date: null,
    expiry_date: null,
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
}

describe("Gap Analysis Engine", () => {
  const m365 = mockProduct({ id: "p-m365", name: "Microsoft 365 Business Premium", sku: "MS-365-BP" });
  const cloudBackup = mockProduct({ id: "p-backup", name: "Cloud Backup", sku: "VBR-365" });
  const mfa = mockProduct({ id: "p-mfa", name: "Multi-Factor Authenticatie (MFA)", sku: "MS-MFA" });
  const firewall = mockProduct({ id: "p-fw", name: "FortiGate Next-Gen Firewall", sku: "FG-60F", type: "hardware" });
  const managedFw = mockProduct({ id: "p-mfw", name: "Managed Firewall Service", sku: "YLD-MFW", type: "service" });
  const endpoint = mockProduct({ id: "p-ep", name: "FortiClient Endpoint Protection", sku: "FC-EP-100" });
  const managedEp = mockProduct({ id: "p-mes", name: "Managed Endpoint Security", sku: "YLD-MES", type: "service" });

  const allProducts = [m365, cloudBackup, mfa, firewall, managedFw, endpoint, managedEp];

  const dependencies: ProductDependency[] = [
    mockDependency("p-m365", "p-mfa", "requires"),       // M365 → MFA (requires)
    mockDependency("p-m365", "p-backup", "requires"),     // M365 → Cloud Backup (requires)
    mockDependency("p-fw", "p-mfw", "recommended"),       // Firewall → Managed FW (recommended)
    mockDependency("p-ep", "p-mes", "enhances"),          // Endpoint → Managed EP (enhances)
  ];

  it("detects missing backup when company has cloud but no backup", () => {
    // Company has M365 but no Cloud Backup and no MFA
    const clientProducts = [mockClientProduct("comp-1", "p-m365")];

    const gaps = computeGaps(clientProducts, dependencies, allProducts);

    expect(gaps.length).toBe(2);

    // Both MFA and Cloud Backup should be detected as critical
    const skus = gaps.map((g) => g.missingProduct.sku);
    expect(skus).toContain("MS-MFA");
    expect(skus).toContain("VBR-365");
  });

  it("returns empty when company has all required products", () => {
    // Company has M365 + MFA + Cloud Backup
    const clientProducts = [
      mockClientProduct("comp-1", "p-m365"),
      mockClientProduct("comp-1", "p-mfa"),
      mockClientProduct("comp-1", "p-backup"),
    ];

    const gaps = computeGaps(clientProducts, dependencies, allProducts);

    expect(gaps.length).toBe(0);
  });

  it("marks critical SKUs as critical severity", () => {
    const clientProducts = [mockClientProduct("comp-1", "p-m365")];
    const gaps = computeGaps(clientProducts, dependencies, allProducts);

    const mfaGap = gaps.find((g) => g.missingProduct.sku === "MS-MFA");
    expect(mfaGap).toBeDefined();
    expect(mfaGap!.severity).toBe("critical");

    const backupGap = gaps.find((g) => g.missingProduct.sku === "VBR-365");
    expect(backupGap).toBeDefined();
    expect(backupGap!.severity).toBe("critical");
  });

  it("marks recommended dependencies as warning severity", () => {
    const clientProducts = [mockClientProduct("comp-1", "p-fw")];
    const gaps = computeGaps(clientProducts, dependencies, allProducts);

    const fwGap = gaps.find((g) => g.missingProduct.sku === "YLD-MFW");
    expect(fwGap).toBeDefined();
    expect(fwGap!.severity).toBe("warning");
  });

  it("marks enhances dependencies as info severity", () => {
    const clientProducts = [mockClientProduct("comp-1", "p-ep")];
    const gaps = computeGaps(clientProducts, dependencies, allProducts);

    const epGap = gaps.find((g) => g.missingProduct.sku === "YLD-MES");
    expect(epGap).toBeDefined();
    expect(epGap!.severity).toBe("info");
  });

  it("sorts results by severity: critical first, then warning, then info", () => {
    // Company has M365 + firewall + endpoint, but nothing else
    const clientProducts = [
      mockClientProduct("comp-1", "p-m365"),
      mockClientProduct("comp-1", "p-fw"),
      mockClientProduct("comp-1", "p-ep"),
    ];
    const gaps = computeGaps(clientProducts, dependencies, allProducts);

    expect(gaps.length).toBe(4);
    expect(gaps[0].severity).toBe("critical");
    expect(gaps[1].severity).toBe("critical");
    expect(gaps[2].severity).toBe("warning");
    expect(gaps[3].severity).toBe("info");
  });

  it("generates correct reason text", () => {
    const clientProducts = [mockClientProduct("comp-1", "p-m365")];
    const gaps = computeGaps(clientProducts, dependencies, allProducts);

    const mfaGap = gaps.find((g) => g.missingProduct.sku === "MS-MFA");
    expect(mfaGap!.reason).toContain("Microsoft 365");
    expect(mfaGap!.reason).toContain("Multi-Factor Authenticatie");
    expect(mfaGap!.reason).toContain("vereist");
  });

  it("includes relatedTo product reference", () => {
    const clientProducts = [mockClientProduct("comp-1", "p-m365")];
    const gaps = computeGaps(clientProducts, dependencies, allProducts);

    const mfaGap = gaps.find((g) => g.missingProduct.sku === "MS-MFA");
    expect(mfaGap!.relatedTo.id).toBe("p-m365");
  });

  it("does not report gaps for products the company does not own", () => {
    // Company has nothing — no source products, so no dependencies trigger
    const gaps = computeGaps([], dependencies, allProducts);

    expect(gaps.length).toBe(0);
  });

  it("analyzeGaps function is exportable", async () => {
    const mod = await import("@/lib/engine/gap-analysis");
    expect(typeof mod.analyzeGaps).toBe("function");
    expect(typeof mod.computeGaps).toBe("function");
  });
});
