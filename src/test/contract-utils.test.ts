import { describe, it, expect } from "vitest";
import {
  daysUntilExpiry,
  isExpiringSoon,
  isManagedService,
  getExpiryBadge,
  countExpiringSoon,
  isMissingManagedCoverage,
} from "@/lib/contract-utils";
import type { Agreement } from "@/types/database";

// Helper to create a date string N days from now
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

function mockAgreement(overrides: Partial<Agreement> = {}): Agreement {
  return {
    id: "a1",
    company_id: "c1",
    cw_agreement_id: 1,
    name: "Test Agreement",
    type: "standard",
    status: "active",
    bill_amount: 100,
    start_date: "2025-01-01",
    end_date: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("contract-utils", () => {
  describe("daysUntilExpiry", () => {
    it("returns null for null end date", () => {
      expect(daysUntilExpiry(null)).toBeNull();
    });

    it("returns positive days for future dates", () => {
      const result = daysUntilExpiry(daysFromNow(30));
      expect(result).toBeGreaterThanOrEqual(29);
      expect(result).toBeLessThanOrEqual(31);
    });

    it("returns negative days for past dates", () => {
      const result = daysUntilExpiry(daysFromNow(-10));
      expect(result).toBeLessThanOrEqual(-9);
      expect(result).toBeGreaterThanOrEqual(-11);
    });

    it("returns 0 for today", () => {
      const today = new Date().toISOString().split("T")[0]!;
      expect(daysUntilExpiry(today)).toBe(0);
    });
  });

  describe("isExpiringSoon", () => {
    it("returns false for null end date", () => {
      expect(isExpiringSoon(null)).toBe(false);
    });

    it("returns true for dates within default 60 days", () => {
      expect(isExpiringSoon(daysFromNow(30))).toBe(true);
    });

    it("returns false for dates beyond 60 days", () => {
      expect(isExpiringSoon(daysFromNow(90))).toBe(false);
    });

    it("returns false for past dates", () => {
      expect(isExpiringSoon(daysFromNow(-5))).toBe(false);
    });

    it("respects custom withinDays parameter", () => {
      expect(isExpiringSoon(daysFromNow(15), 10)).toBe(false);
      expect(isExpiringSoon(daysFromNow(5), 10)).toBe(true);
    });
  });

  describe("isManagedService", () => {
    it("detects managed service keywords in name", () => {
      expect(isManagedService({ name: "Managed Security", type: null })).toBe(true);
      expect(isManagedService({ name: "IT Beheer Plus", type: null })).toBe(true);
      expect(isManagedService({ name: "Server Monitoring", type: null })).toBe(true);
      expect(isManagedService({ name: "Patch Management", type: null })).toBe(true);
      expect(isManagedService({ name: "Helpdesk Basic", type: null })).toBe(true);
      expect(isManagedService({ name: "Support Plan", type: null })).toBe(true);
    });

    it("detects keywords in type field", () => {
      expect(isManagedService({ name: "Plan A", type: "managed" })).toBe(true);
    });

    it("returns false for non-managed services", () => {
      expect(isManagedService({ name: "Office 365 License", type: "license" })).toBe(false);
      expect(isManagedService({ name: "Hardware Bundle", type: null })).toBe(false);
    });

    it("is case insensitive", () => {
      expect(isManagedService({ name: "MANAGED SERVICES", type: null })).toBe(true);
    });
  });

  describe("getExpiryBadge", () => {
    it("returns show: false for null end date", () => {
      const badge = getExpiryBadge(null);
      expect(badge.show).toBe(false);
    });

    it("returns show: false for past dates", () => {
      const badge = getExpiryBadge(daysFromNow(-5));
      expect(badge.show).toBe(false);
    });

    it("returns show: false for dates beyond 60 days", () => {
      const badge = getExpiryBadge(daysFromNow(90));
      expect(badge.show).toBe(false);
    });

    it("returns urgent text for dates within 7 days", () => {
      const badge = getExpiryBadge(daysFromNow(3));
      expect(badge.show).toBe(true);
      expect(badge.text).toContain("actie vereist");
    });

    it("returns singular 'dag' for 1 day", () => {
      const badge = getExpiryBadge(daysFromNow(1));
      expect(badge.show).toBe(true);
      expect(badge.text).toContain("1 dag");
    });

    it("returns normal text for dates 8-60 days out", () => {
      const badge = getExpiryBadge(daysFromNow(30));
      expect(badge.show).toBe(true);
      expect(badge.text).toContain("Verloopt over");
      expect(badge.text).not.toContain("actie vereist");
    });
  });

  describe("countExpiringSoon", () => {
    it("returns 0 for empty array", () => {
      expect(countExpiringSoon([])).toBe(0);
    });

    it("counts only active agreements expiring within 60 days", () => {
      const agreements = [
        mockAgreement({ status: "active", end_date: daysFromNow(30) }),
        mockAgreement({ status: "active", end_date: daysFromNow(90) }),
        mockAgreement({ status: "cancelled", end_date: daysFromNow(10) }),
        mockAgreement({ status: "active", end_date: null }),
      ];
      expect(countExpiringSoon(agreements)).toBe(1);
    });
  });

  describe("isMissingManagedCoverage", () => {
    it("returns false for empty agreements", () => {
      expect(isMissingManagedCoverage([])).toBe(false);
    });

    it("returns true when active agreements exist but none are managed", () => {
      const agreements = [
        mockAgreement({ status: "active", name: "Office 365" }),
        mockAgreement({ status: "active", name: "Hardware Lease" }),
      ];
      expect(isMissingManagedCoverage(agreements)).toBe(true);
    });

    it("returns false when at least one managed service exists", () => {
      const agreements = [
        mockAgreement({ status: "active", name: "Office 365" }),
        mockAgreement({ status: "active", name: "Managed Backup" }),
      ];
      expect(isMissingManagedCoverage(agreements)).toBe(false);
    });

    it("ignores inactive agreements", () => {
      const agreements = [
        mockAgreement({ status: "cancelled", name: "Managed Security" }),
      ];
      expect(isMissingManagedCoverage(agreements)).toBe(false);
    });
  });
});
