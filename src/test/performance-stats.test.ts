import { describe, it, expect } from "vitest";
import {
  calculateSLAMetrics,
  getCategoryBreakdown,
  getMonthlyTrends,
  formatMinutes,
} from "@/lib/performance-stats";
import type { Ticket } from "@/types/database";

const makeTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: "t1",
  company_id: "c1",
  cw_ticket_id: null,
  summary: "Test ticket",
  description: null,
  status: "closed",
  priority: "normal",
  contact_name: null,
  source: "Email",
  is_closed: true,
  cw_created_at: "2026-01-01T08:00:00Z",
  cw_updated_at: "2026-01-01T12:00:00Z",
  created_at: "2026-01-01T08:00:00Z",
  updated_at: "2026-01-01T12:00:00Z",
  ...overrides,
});

describe("calculateSLAMetrics", () => {
  it("returns zero metrics for empty tickets", () => {
    const metrics = calculateSLAMetrics([]);
    expect(metrics.totalResolved).toBe(0);
    expect(metrics.slaCompliancePercent).toBe(100);
    expect(metrics.avgResponseMinutes).toBe(0);
    expect(metrics.avgResolveMinutes).toBe(0);
  });

  it("calculates metrics for closed tickets", () => {
    const tickets = [
      makeTicket(),
      makeTicket({
        id: "t2",
        cw_created_at: "2026-01-02T09:00:00Z",
        cw_updated_at: "2026-01-02T11:00:00Z",
      }),
    ];
    const metrics = calculateSLAMetrics(tickets);
    expect(metrics.totalResolved).toBe(2);
    expect(metrics.avgResolveMinutes).toBeGreaterThan(0);
    expect(metrics.avgResponseMinutes).toBeGreaterThan(0);
  });

  it("ignores open tickets", () => {
    const tickets = [
      makeTicket(),
      makeTicket({ id: "t2", is_closed: false, status: "open" }),
    ];
    const metrics = calculateSLAMetrics(tickets);
    expect(metrics.totalResolved).toBe(1);
  });

  it("counts SLA breaches for urgent tickets resolved slowly", () => {
    const tickets = [
      makeTicket({
        priority: "urgent",
        cw_created_at: "2026-01-01T08:00:00Z",
        cw_updated_at: "2026-01-01T20:00:00Z", // 12h > 1h target
      }),
    ];
    const metrics = calculateSLAMetrics(tickets);
    expect(metrics.totalBreached).toBe(1);
  });

  it("compliance is 100% when all within SLA", () => {
    const tickets = [
      makeTicket({
        priority: "low",
        cw_created_at: "2026-01-01T08:00:00Z",
        cw_updated_at: "2026-01-01T09:00:00Z", // 1h < 24h target
      }),
    ];
    const metrics = calculateSLAMetrics(tickets);
    expect(metrics.slaCompliancePercent).toBe(100);
  });
});

describe("getCategoryBreakdown", () => {
  it("groups tickets by source", () => {
    const tickets = [
      makeTicket({ source: "Email" }),
      makeTicket({ id: "t2", source: "Email" }),
      makeTicket({ id: "t3", source: "Telefoon" }),
    ];
    const breakdown = getCategoryBreakdown(tickets);
    const emailCat = breakdown.find((b) => b.category === "Email");
    expect(emailCat?.count).toBe(2);
  });

  it("uses Overig for null source", () => {
    const tickets = [makeTicket({ source: null })];
    const breakdown = getCategoryBreakdown(tickets);
    expect(breakdown[0].category).toBe("Overig");
  });

  it("sorts by count descending", () => {
    const tickets = [
      makeTicket({ source: "A" }),
      makeTicket({ id: "t2", source: "B" }),
      makeTicket({ id: "t3", source: "B" }),
    ];
    const breakdown = getCategoryBreakdown(tickets);
    expect(breakdown[0].category).toBe("B");
  });

  it("returns empty for no closed tickets", () => {
    const tickets = [makeTicket({ is_closed: false })];
    expect(getCategoryBreakdown(tickets)).toHaveLength(0);
  });
});

describe("getMonthlyTrends", () => {
  it("returns 6 months", () => {
    const trends = getMonthlyTrends([]);
    expect(trends).toHaveLength(6);
  });

  it("each month has required fields", () => {
    const trends = getMonthlyTrends([]);
    for (const trend of trends) {
      expect(trend).toHaveProperty("month");
      expect(trend).toHaveProperty("resolved");
      expect(trend).toHaveProperty("slaCompliance");
      expect(trend).toHaveProperty("avgResponse");
    }
  });

  it("empty months have 100% compliance", () => {
    const trends = getMonthlyTrends([]);
    for (const trend of trends) {
      expect(trend.slaCompliance).toBe(100);
    }
  });
});

describe("formatMinutes", () => {
  it("formats minutes under 60", () => {
    expect(formatMinutes(45)).toBe("45 min");
  });

  it("formats exact hours", () => {
    expect(formatMinutes(120)).toBe("2 uur");
  });

  it("formats hours and minutes", () => {
    expect(formatMinutes(150)).toBe("2u 30m");
  });

  it("formats zero minutes", () => {
    expect(formatMinutes(0)).toBe("0 min");
  });
});
