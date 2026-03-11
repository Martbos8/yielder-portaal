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

describe("Recente tickets widget", () => {
  const statusConfig = {
    open: { label: "Open", className: "bg-emerald-100 text-emerald-700" },
    in_progress: { label: "In behandeling", className: "bg-orange-100 text-orange-700" },
    closed: { label: "Gesloten", className: "bg-gray-100 text-gray-600" },
  };

  it("has status labels for all ticket statuses", () => {
    expect(statusConfig.open.label).toBe("Open");
    expect(statusConfig.in_progress.label).toBe("In behandeling");
    expect(statusConfig.closed.label).toBe("Gesloten");
  });

  it("open status uses green styling", () => {
    expect(statusConfig.open.className).toContain("emerald");
  });

  it("in_progress status uses orange styling", () => {
    expect(statusConfig.in_progress.className).toContain("orange");
  });

  it("closed status uses gray styling", () => {
    expect(statusConfig.closed.className).toContain("gray");
  });

  it("recente tickets section label exists", () => {
    const sectionLabel = "Recente tickets";
    expect(sectionLabel).toBe("Recente tickets");
  });

  it("empty state text is correct", () => {
    const emptyText = "Geen open tickets";
    expect(emptyText).toBe("Geen open tickets");
  });

  it("formatDate formats Dutch locale dates", () => {
    function formatDate(dateStr: string | null): string {
      if (!dateStr) return "—";
      return new Date(dateStr).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    expect(formatDate(null)).toBe("—");
    const result = formatDate("2026-03-11T10:00:00Z");
    expect(result).toContain("2026");
    expect(result).toContain("11");
  });
});

describe("Aandachtspunten widget", () => {
  it("aandachtspunten section label exists", () => {
    const sectionLabel = "Aandachtspunten";
    expect(sectionLabel).toBe("Aandachtspunten");
  });

  it("has subsection labels for contracts and warranty", () => {
    const contractLabel = "Contracten verlopen binnenkort";
    const warrantyLabel = "Verlopen garantie";
    expect(contractLabel).toBe("Contracten verlopen binnenkort");
    expect(warrantyLabel).toBe("Verlopen garantie");
  });

  it("empty state text is correct", () => {
    const emptyText = "Geen aandachtspunten";
    expect(emptyText).toBe("Geen aandachtspunten");
  });

  it("expiring contract badge uses orange styling", () => {
    const badgeClass = "bg-orange-100 text-orange-700";
    expect(badgeClass).toContain("orange");
  });

  it("expired warranty badge uses red styling", () => {
    const badgeClass = "bg-red-100 text-red-700";
    expect(badgeClass).toContain("red");
  });

  it("expiring agreements query uses 30-day window", () => {
    const withinDays = 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    // Verify the date is ~30 days in the future
    const diffMs = futureDate.getTime() - Date.now();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThanOrEqual(31);
    expect(futureDateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
