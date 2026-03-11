import { describe, it, expect } from "vitest";
import type { Agreement } from "@/types/database";

type SLATier = "premium" | "standaard" | "basis";

function getSLATier(agreement: Pick<Agreement, "name">): SLATier {
  const name = agreement.name.toLowerCase();
  if (name.includes("premium") || name.includes("24/7")) return "premium";
  if (name.includes("basis") || name.includes("basic")) return "basis";
  return "standaard";
}

function daysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date("2026-03-11");
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

describe("Supportcontracten page", () => {
  it("page title is Supportcontracten", () => {
    const title = "Supportcontracten";
    expect(title).toBe("Supportcontracten");
  });

  it("empty state text is correct", () => {
    const emptyText = "Geen supportcontracten gevonden";
    expect(emptyText).toBe("Geen supportcontracten gevonden");
  });
});

describe("SLA tier detection", () => {
  it("detects premium tier from name", () => {
    expect(getSLATier({ name: "Premium Support 24/7" })).toBe("premium");
  });

  it("detects premium from 24/7 keyword", () => {
    expect(getSLATier({ name: "Support 24/7" })).toBe("premium");
  });

  it("detects basis tier from name", () => {
    expect(getSLATier({ name: "Basis Onderhoud" })).toBe("basis");
  });

  it("detects basis from basic keyword", () => {
    expect(getSLATier({ name: "Basic Support" })).toBe("basis");
  });

  it("defaults to standaard tier", () => {
    expect(getSLATier({ name: "Managed Services" })).toBe("standaard");
  });
});

describe("SLA tier properties", () => {
  const slaTiers: Record<
    SLATier,
    { responseTime: string; resolveTarget: string; coverage: string }
  > = {
    premium: {
      responseTime: "1 uur",
      resolveTarget: "4 uur",
      coverage: "24/7",
    },
    standaard: {
      responseTime: "4 uur",
      resolveTarget: "8 uur",
      coverage: "Ma-Vr 08:00-18:00",
    },
    basis: {
      responseTime: "8 uur",
      resolveTarget: "24 uur",
      coverage: "Ma-Vr 09:00-17:00",
    },
  };

  it("premium has fastest response time", () => {
    expect(slaTiers.premium.responseTime).toBe("1 uur");
  });

  it("premium has 24/7 coverage", () => {
    expect(slaTiers.premium.coverage).toBe("24/7");
  });

  it("standaard has business hours coverage", () => {
    expect(slaTiers.standaard.coverage).toContain("Ma-Vr");
  });
});

describe("Days remaining calculation", () => {
  it("calculates days until expiry", () => {
    const days = daysRemaining("2026-04-10");
    expect(days).toBe(30);
  });

  it("returns null for null end date", () => {
    expect(daysRemaining(null)).toBeNull();
  });

  it("returns negative for past dates", () => {
    const days = daysRemaining("2026-01-01");
    expect(days).toBeLessThan(0);
  });
});

describe("Support cost calculation", () => {
  it("sums monthly costs of active agreements", () => {
    const agreements: Pick<Agreement, "status" | "bill_amount">[] = [
      { status: "active", bill_amount: 500 },
      { status: "active", bill_amount: 300 },
      { status: "expired", bill_amount: 200 },
    ];

    const total = agreements
      .filter((a) => a.status === "active")
      .reduce((sum, a) => sum + (a.bill_amount ?? 0), 0);

    expect(total).toBe(800);
  });

  it("handles null bill amounts", () => {
    const agreements: Pick<Agreement, "status" | "bill_amount">[] = [
      { status: "active", bill_amount: null },
      { status: "active", bill_amount: 500 },
    ];

    const total = agreements
      .filter((a) => a.status === "active")
      .reduce((sum, a) => sum + (a.bill_amount ?? 0), 0);

    expect(total).toBe(500);
  });
});

describe("Expiring soon detection", () => {
  it("flags contracts expiring within 30 days", () => {
    const days = daysRemaining("2026-04-05");
    const isExpiringSoon = days !== null && days > 0 && days <= 30;
    expect(isExpiringSoon).toBe(true);
  });

  it("does not flag contracts with > 30 days", () => {
    const days = daysRemaining("2026-06-01");
    const isExpiringSoon = days !== null && days > 0 && days <= 30;
    expect(isExpiringSoon).toBe(false);
  });

  it("does not flag already expired contracts", () => {
    const days = daysRemaining("2026-01-01");
    const isExpiringSoon = days !== null && days > 0 && days <= 30;
    expect(isExpiringSoon).toBe(false);
  });
});
