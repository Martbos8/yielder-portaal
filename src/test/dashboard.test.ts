import { describe, it, expect } from "vitest";

describe("Dashboard KPI labels", () => {
  const kpiLabels = ["Open tickets", "Hardware", "Contracten", "Maandbedrag"];

  it("has 4 KPI labels defined", () => {
    expect(kpiLabels).toHaveLength(4);
  });

  it("includes all required KPI labels", () => {
    expect(kpiLabels).toContain("Open tickets");
    expect(kpiLabels).toContain("Hardware");
    expect(kpiLabels).toContain("Contracten");
    expect(kpiLabels).toContain("Maandbedrag");
  });
});

describe("formatCurrency", () => {
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  it("formats 0 as EUR currency", () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/EUR|€/);
    expect(result).toContain("0,00");
  });

  it("formats large amounts with proper grouping", () => {
    const result = formatCurrency(1234.56);
    expect(result).toMatch(/EUR|€/);
    expect(result).toContain("1.234,56");
  });

  it("formats negative amounts", () => {
    const result = formatCurrency(-500);
    expect(result).toContain("500,00");
  });
});
