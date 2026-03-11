import { describe, it, expect } from "vitest";
import type {
  ScalePadClient,
  ScalePadHardwareAsset,
  ScalePadLifecycle,
} from "@/lib/connectors/scalepad";
import { ScalePadApiClient } from "@/lib/connectors/scalepad";

describe("ScalePad API client", () => {
  it("returns not configured without env vars", () => {
    const client = new ScalePadApiClient();
    expect(client.isConfigured()).toBe(false);
  });

  it("returns empty arrays when not configured", async () => {
    const client = new ScalePadApiClient();
    const clients = await client.fetchClients();
    expect(clients).toEqual([]);
  });

  it("returns empty assets when not configured", async () => {
    const client = new ScalePadApiClient();
    const assets = await client.fetchHardwareAssets("test-id");
    expect(assets).toEqual([]);
  });

  it("returns empty lifecycles when not configured", async () => {
    const client = new ScalePadApiClient();
    const lifecycles = await client.fetchHardwareLifecycles("test-id");
    expect(lifecycles).toEqual([]);
  });

  it("ScalePadClient type has required fields", () => {
    const client: ScalePadClient = {
      id: "sp-1",
      name: "Test Bedrijf",
      externalId: "cw-123",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(client.id).toBe("sp-1");
    expect(client.name).toBe("Test Bedrijf");
    expect(client.isActive).toBe(true);
  });

  it("ScalePadHardwareAsset type has required fields", () => {
    const asset: ScalePadHardwareAsset = {
      id: "asset-1",
      clientId: "sp-1",
      name: "Dell Latitude 5550",
      manufacturer: "Dell",
      model: "Latitude 5550",
      serialNumber: "SN123456",
      category: "Laptop",
      operatingSystem: "Windows 11 Pro",
      cpu: "Intel Core i7",
      ramGb: 16,
      diskGb: 512,
      purchaseDate: "2025-06-15",
      warrantyExpiry: "2028-06-15",
      endOfLife: "2030-06-15",
      lastSeen: "2026-03-10T08:00:00Z",
      status: "active",
    };
    expect(asset.manufacturer).toBe("Dell");
    expect(asset.ramGb).toBe(16);
    expect(asset.status).toBe("active");
  });

  it("ScalePadLifecycle type has required fields", () => {
    const lifecycle: ScalePadLifecycle = {
      assetId: "asset-1",
      phase: "current",
      warrantyStatus: "covered",
      warrantyExpiry: "2028-06-15",
      endOfLife: "2030-06-15",
      replacementUrgency: "none",
      recommendedAction: null,
    };
    expect(lifecycle.phase).toBe("current");
    expect(lifecycle.warrantyStatus).toBe("covered");
    expect(lifecycle.replacementUrgency).toBe("none");
  });
});
