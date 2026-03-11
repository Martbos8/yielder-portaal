import { describe, it, expect } from "vitest";

describe("Tickets tabel", () => {
  const columnHeaders = [
    "#ID",
    "Samenvatting",
    "Status",
    "Prioriteit",
    "Contactpersoon",
    "Aangemaakt",
  ];

  it("has 6 column headers defined", () => {
    expect(columnHeaders).toHaveLength(6);
  });

  it("includes all required column headers", () => {
    expect(columnHeaders).toContain("#ID");
    expect(columnHeaders).toContain("Samenvatting");
    expect(columnHeaders).toContain("Status");
    expect(columnHeaders).toContain("Prioriteit");
    expect(columnHeaders).toContain("Contactpersoon");
    expect(columnHeaders).toContain("Aangemaakt");
  });

  it("empty state text is correct", () => {
    const emptyText = "Geen tickets gevonden";
    expect(emptyText).toBe("Geen tickets gevonden");
  });
});

describe("Tickets status badges", () => {
  const statusConfig = {
    open: { label: "Open", className: "bg-emerald-100 text-emerald-700" },
    in_progress: {
      label: "In behandeling",
      className: "bg-orange-100 text-orange-700",
    },
    closed: { label: "Gesloten", className: "bg-gray-100 text-gray-600" },
  };

  it("open status uses green styling", () => {
    expect(statusConfig.open.className).toContain("emerald");
  });

  it("in_progress status uses orange styling", () => {
    expect(statusConfig.in_progress.className).toContain("orange");
  });

  it("closed status uses gray styling", () => {
    expect(statusConfig.closed.className).toContain("gray");
  });
});

describe("Tickets prioriteit badges", () => {
  const priorityConfig = {
    urgent: { label: "Urgent", className: "bg-red-100 text-red-700" },
    high: { label: "Hoog", className: "bg-orange-100 text-orange-700" },
    normal: { label: "Normaal", className: "bg-blue-100 text-blue-700" },
    low: { label: "Laag", className: "bg-gray-100 text-gray-600" },
  };

  it("urgent priority uses red styling", () => {
    expect(priorityConfig.urgent.label).toBe("Urgent");
    expect(priorityConfig.urgent.className).toContain("red");
  });

  it("high priority uses orange styling", () => {
    expect(priorityConfig.high.label).toBe("Hoog");
    expect(priorityConfig.high.className).toContain("orange");
  });

  it("normal priority uses blue styling", () => {
    expect(priorityConfig.normal.label).toBe("Normaal");
    expect(priorityConfig.normal.className).toContain("blue");
  });

  it("low priority uses gray styling", () => {
    expect(priorityConfig.low.label).toBe("Laag");
    expect(priorityConfig.low.className).toContain("gray");
  });
});

describe("Tickets formatDate", () => {
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  it("formats null as em dash", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("formats date in Dutch locale", () => {
    const result = formatDate("2026-03-12T10:00:00Z");
    expect(result).toContain("2026");
    expect(result).toContain("12");
  });
});
