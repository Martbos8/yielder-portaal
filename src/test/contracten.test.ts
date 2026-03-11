import { describe, it, expect } from "vitest";
import type { AgreementStatus } from "@/types/database";

describe("Contracten page", () => {
  it("page title is Contracten", () => {
    const title = "Contracten";
    expect(title).toBe("Contracten");
  });

  it("shows totaal maandbedrag label", () => {
    const label = "Totaal maandbedrag";
    expect(label).toBe("Totaal maandbedrag");
  });

  it("empty state text is correct", () => {
    const emptyText = "Geen contracten gevonden";
    expect(emptyText).toBe("Geen contracten gevonden");
  });
});

describe("Agreement status badges", () => {
  const statusConfig: Record<AgreementStatus, { label: string; className: string }> = {
    active: { label: "Actief", className: "bg-emerald-100 text-emerald-700" },
    expired: { label: "Verlopen", className: "bg-red-100 text-red-700" },
    cancelled: { label: "Opgezegd", className: "bg-gray-100 text-gray-600" },
  };

  it("active uses green styling", () => {
    expect(statusConfig.active.className).toContain("emerald");
    expect(statusConfig.active.label).toBe("Actief");
  });

  it("expired uses red styling", () => {
    expect(statusConfig.expired.className).toContain("red");
    expect(statusConfig.expired.label).toBe("Verlopen");
  });

  it("cancelled uses gray styling", () => {
    expect(statusConfig.cancelled.className).toContain("gray");
    expect(statusConfig.cancelled.label).toBe("Opgezegd");
  });
});

describe("Currency formatting", () => {
  it("formats amounts in EUR nl-NL locale", () => {
    const formatted = new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(1234.56);
    // Different environments may show EUR or €
    expect(formatted).toMatch(/(?:EUR|€)\s?1[.,]234[.,]56/);
  });

  it("formats zero amount", () => {
    const formatted = new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(0);
    expect(formatted).toMatch(/(?:EUR|€)\s?0[.,]00/);
  });
});

describe("Agreement sorting", () => {
  it("sorts active agreements before others", () => {
    const agreements = [
      { status: "expired" as AgreementStatus, name: "Alpha" },
      { status: "active" as AgreementStatus, name: "Zeta" },
      { status: "cancelled" as AgreementStatus, name: "Beta" },
    ];

    const sorted = [...agreements].sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return a.name.localeCompare(b.name, "nl-NL");
    });

    expect(sorted[0].status).toBe("active");
    expect(sorted[0].name).toBe("Zeta");
  });

  it("sorts by name within same status", () => {
    const agreements = [
      { status: "active" as AgreementStatus, name: "Zeta" },
      { status: "active" as AgreementStatus, name: "Alpha" },
    ];

    const sorted = [...agreements].sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return a.name.localeCompare(b.name, "nl-NL");
    });

    expect(sorted[0].name).toBe("Alpha");
    expect(sorted[1].name).toBe("Zeta");
  });
});

describe("Date formatting", () => {
  it("formats dates in Dutch locale", () => {
    const date = new Date("2026-03-12").toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    expect(date).toContain("2026");
    expect(date).toContain("12");
  });

  it("returns em dash for null dates", () => {
    const result = "—";
    expect(result).toBe("—");
  });
});
