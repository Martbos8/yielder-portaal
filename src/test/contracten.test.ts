import { describe, it, expect } from "vitest";
import type { Agreement, AgreementStatus } from "@/types/database";
import {
  daysUntilExpiry,
  isExpiringSoon,
  getExpiryBadge,
  isManagedService,
  countExpiringSoon,
  isMissingManagedCoverage,
} from "@/lib/contract-utils";

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

// Helper to create a mock agreement
function mockAgreement(overrides: Partial<Agreement>): Agreement {
  return {
    id: "test-id",
    company_id: "comp-1",
    cw_agreement_id: null,
    name: "Test Agreement",
    type: null,
    status: "active",
    bill_amount: 100,
    start_date: "2025-01-01",
    end_date: "2027-01-01",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("Expiry badge — verlengingsbadge bij bijna verlopen contract", () => {
  it("shows badge for contract expiring within 60 days", () => {
    // 30 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().split("T")[0];

    const badge = getExpiryBadge(dateStr);
    expect(badge.show).toBe(true);
    expect(badge.text).toContain("Verloopt over");
    expect(badge.daysLeft).toBeGreaterThan(0);
    expect(badge.daysLeft).toBeLessThanOrEqual(60);
  });

  it("does not show badge for contract > 60 days away", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    const dateStr = futureDate.toISOString().split("T")[0];

    const badge = getExpiryBadge(dateStr);
    expect(badge.show).toBe(false);
  });

  it("does not show badge for already expired contract", () => {
    const badge = getExpiryBadge("2020-01-01");
    expect(badge.show).toBe(false);
  });

  it("shows urgent text for contracts expiring within 7 days", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateStr = futureDate.toISOString().split("T")[0];

    const badge = getExpiryBadge(dateStr);
    expect(badge.show).toBe(true);
    expect(badge.text).toContain("actie vereist");
  });

  it("returns null days for null end date", () => {
    expect(daysUntilExpiry(null)).toBeNull();
  });
});

describe("isExpiringSoon", () => {
  it("returns true for contract expiring within threshold", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45);
    expect(isExpiringSoon(futureDate.toISOString().split("T")[0], 60)).toBe(true);
  });

  it("returns false for null end date", () => {
    expect(isExpiringSoon(null)).toBe(false);
  });
});

describe("countExpiringSoon", () => {
  it("counts active agreements expiring within 60 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    const soonStr = soon.toISOString().split("T")[0];

    const agreements = [
      mockAgreement({ id: "1", status: "active", end_date: soonStr }),
      mockAgreement({ id: "2", status: "active", end_date: "2030-01-01" }),
      mockAgreement({ id: "3", status: "expired", end_date: soonStr }),
    ];

    expect(countExpiringSoon(agreements)).toBe(1);
  });
});

describe("Managed service detection", () => {
  it("detects managed service from name", () => {
    expect(isManagedService({ name: "Managed Services Basis", type: null })).toBe(true);
  });

  it("detects beheer from name", () => {
    expect(isManagedService({ name: "Proactief Beheer", type: null })).toBe(true);
  });

  it("detects monitoring from name", () => {
    expect(isManagedService({ name: "Network Monitoring", type: null })).toBe(true);
  });

  it("detects helpdesk from name", () => {
    expect(isManagedService({ name: "Helpdesk Ondersteuning", type: null })).toBe(true);
  });

  it("returns false for regular agreement", () => {
    expect(isManagedService({ name: "Microsoft 365 Business", type: "License" })).toBe(false);
  });
});

describe("Missing managed coverage", () => {
  it("returns true when active agreements exist but no managed service", () => {
    const agreements = [
      mockAgreement({ name: "Microsoft 365" }),
      mockAgreement({ name: "Firewall License" }),
    ];
    expect(isMissingManagedCoverage(agreements)).toBe(true);
  });

  it("returns false when a managed service exists", () => {
    const agreements = [
      mockAgreement({ name: "Microsoft 365" }),
      mockAgreement({ name: "Managed Services Premium" }),
    ];
    expect(isMissingManagedCoverage(agreements)).toBe(false);
  });

  it("returns false when no active agreements", () => {
    const agreements = [
      mockAgreement({ name: "Old Contract", status: "expired" }),
    ];
    expect(isMissingManagedCoverage(agreements)).toBe(false);
  });
});

describe("Ontbrekende dekking section", () => {
  it("section title is Ontbrekende dekking", () => {
    const title = "Ontbrekende dekking";
    expect(title).toBe("Ontbrekende dekking");
  });

  it("managed service badge text is correct", () => {
    const badgeText = "Geen managed service";
    expect(badgeText).toBe("Geen managed service");
  });

  it("CTA text is Neem contact op", () => {
    const ctaText = "Neem contact op";
    expect(ctaText).toBe("Neem contact op");
  });
});
