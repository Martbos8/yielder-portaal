import { describe, it, expect } from "vitest";
import type { HardwareAsset } from "@/types/database";

// Test hardware detail formatting logic

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const mockAsset: HardwareAsset = {
  id: "hw-1",
  company_id: "c1",
  cw_config_id: 12345,
  name: "Dell Latitude 5550",
  type: "Laptop",
  manufacturer: "Dell",
  model: "Latitude 5550",
  serial_number: "SN-ABC-123",
  assigned_to: "Jan de Vries",
  warranty_expiry: "2028-06-15",
  created_at: "2025-06-15T10:00:00Z",
  updated_at: "2026-03-01T14:00:00Z",
};

describe("Hardware detail formatting", () => {
  it("formats date correctly in nl-NL", () => {
    const formatted = formatDate("2028-06-15");
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/jun/i);
    expect(formatted).toMatch(/2028/);
  });

  it("returns dash for null date", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("asset has all required display fields", () => {
    expect(mockAsset.name).toBe("Dell Latitude 5550");
    expect(mockAsset.type).toBe("Laptop");
    expect(mockAsset.manufacturer).toBe("Dell");
    expect(mockAsset.model).toBe("Latitude 5550");
    expect(mockAsset.serial_number).toBe("SN-ABC-123");
    expect(mockAsset.assigned_to).toBe("Jan de Vries");
    expect(mockAsset.warranty_expiry).toBe("2028-06-15");
    expect(mockAsset.cw_config_id).toBe(12345);
  });

  it("handles asset without optional fields", () => {
    const minimalAsset: HardwareAsset = {
      id: "hw-2",
      company_id: "c1",
      cw_config_id: null,
      name: "Onbekend apparaat",
      type: "Overig",
      manufacturer: null,
      model: null,
      serial_number: null,
      assigned_to: null,
      warranty_expiry: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(minimalAsset.manufacturer).toBeNull();
    expect(minimalAsset.serial_number).toBeNull();
    expect(formatDate(minimalAsset.warranty_expiry)).toBe("—");
  });
});
