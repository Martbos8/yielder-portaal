import { describe, it, expect } from "vitest";
import {
  calculateHealthScores,
  generateHealthTrends,
  getOverallScore,
  getScoreColorClass,
  getScoreLabelText,
  getScoreRingColor,
} from "@/lib/health-scores";
import type { Ticket, HardwareAsset } from "@/types/database";

const makeTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: "t1",
  company_id: "c1",
  cw_ticket_id: null,
  summary: "Test ticket",
  description: null,
  status: "open",
  priority: "normal",
  contact_name: null,
  source: null,
  is_closed: false,
  cw_created_at: null,
  cw_updated_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

const makeHardware = (overrides: Partial<HardwareAsset> = {}): HardwareAsset => ({
  id: "h1",
  company_id: "c1",
  cw_config_id: null,
  name: "Test Laptop",
  type: "Laptop",
  manufacturer: null,
  model: null,
  serial_number: null,
  assigned_to: null,
  warranty_expiry: "2027-12-31",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("calculateHealthScores", () => {
  it("returns 4 health scores", () => {
    const scores = calculateHealthScores([], []);
    expect(scores).toHaveLength(4);
  });

  it("returns scores for uptime, patching, backups, security", () => {
    const scores = calculateHealthScores([], []);
    const categories = scores.map((s) => s.category);
    expect(categories).toContain("uptime");
    expect(categories).toContain("patching");
    expect(categories).toContain("backups");
    expect(categories).toContain("security");
  });

  it("all scores are between 0 and 100", () => {
    const tickets = [
      makeTicket({ priority: "urgent" }),
      makeTicket({ priority: "high" }),
      makeTicket({ summary: "backup failure" }),
      makeTicket({ summary: "security breach" }),
    ];
    const hardware = [
      makeHardware({ warranty_expiry: "2020-01-01" }),
      makeHardware({ warranty_expiry: "2020-06-01", id: "h2" }),
    ];
    const scores = calculateHealthScores(tickets, hardware);
    for (const score of scores) {
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    }
  });

  it("urgent tickets reduce uptime score", () => {
    const noUrgent = calculateHealthScores([], []);
    const withUrgent = calculateHealthScores(
      [makeTicket({ priority: "urgent" }), makeTicket({ priority: "high", id: "t2" })],
      []
    );
    const uptimeNone = noUrgent.find((s) => s.category === "uptime")!.score;
    const uptimeWith = withUrgent.find((s) => s.category === "uptime")!.score;
    expect(uptimeWith).toBeLessThan(uptimeNone);
  });

  it("expired warranty reduces patching score", () => {
    const noExpired = calculateHealthScores([], [makeHardware()]);
    const withExpired = calculateHealthScores([], [
      makeHardware({ warranty_expiry: "2020-01-01" }),
    ]);
    const patchGood = noExpired.find((s) => s.category === "patching")!.score;
    const patchBad = withExpired.find((s) => s.category === "patching")!.score;
    expect(patchBad).toBeLessThan(patchGood);
  });

  it("backup-related tickets reduce backup score", () => {
    const noBackup = calculateHealthScores([], []);
    const withBackup = calculateHealthScores(
      [makeTicket({ summary: "Backup gefaald op server" })],
      []
    );
    const backupGood = noBackup.find((s) => s.category === "backups")!.score;
    const backupBad = withBackup.find((s) => s.category === "backups")!.score;
    expect(backupBad).toBeLessThan(backupGood);
  });
});

describe("getOverallScore", () => {
  it("averages all scores", () => {
    const scores = calculateHealthScores([], []);
    const overall = getOverallScore(scores);
    const manual = Math.round(
      scores.reduce((s, sc) => s + sc.score, 0) / scores.length
    );
    expect(overall).toBe(manual);
  });

  it("returns 0 for empty array", () => {
    expect(getOverallScore([])).toBe(0);
  });
});

describe("getScoreColorClass", () => {
  it("returns green for scores >= 80", () => {
    expect(getScoreColorClass(85)).toContain("emerald");
  });

  it("returns yellow for scores 60-79", () => {
    expect(getScoreColorClass(70)).toContain("yellow");
  });

  it("returns red for scores < 60", () => {
    expect(getScoreColorClass(40)).toContain("red");
  });
});

describe("getScoreLabelText", () => {
  it("returns Uitstekend for >= 90", () => {
    expect(getScoreLabelText(95)).toBe("Uitstekend");
  });

  it("returns Goed for >= 80", () => {
    expect(getScoreLabelText(85)).toBe("Goed");
  });

  it("returns Voldoende for >= 60", () => {
    expect(getScoreLabelText(65)).toBe("Voldoende");
  });

  it("returns Matig for >= 40", () => {
    expect(getScoreLabelText(45)).toBe("Matig");
  });

  it("returns Onvoldoende for < 40", () => {
    expect(getScoreLabelText(30)).toBe("Onvoldoende");
  });
});

describe("getScoreRingColor", () => {
  it("returns green hex for >= 80", () => {
    expect(getScoreRingColor(90)).toBe("#10b981");
  });

  it("returns yellow hex for 60-79", () => {
    expect(getScoreRingColor(70)).toBe("#eab308");
  });

  it("returns red hex for < 60", () => {
    expect(getScoreRingColor(40)).toBe("#ef4444");
  });
});

describe("generateHealthTrends", () => {
  it("returns 6 months of data", () => {
    const scores = calculateHealthScores([], []);
    const trends = generateHealthTrends(scores);
    expect(trends).toHaveLength(6);
  });

  it("each trend has all 4 categories", () => {
    const scores = calculateHealthScores([], []);
    const trends = generateHealthTrends(scores);
    for (const trend of trends) {
      expect(trend).toHaveProperty("uptime");
      expect(trend).toHaveProperty("patching");
      expect(trend).toHaveProperty("backups");
      expect(trend).toHaveProperty("security");
      expect(trend).toHaveProperty("month");
    }
  });

  it("all trend values are between 40 and 100", () => {
    const scores = calculateHealthScores([], []);
    const trends = generateHealthTrends(scores);
    for (const trend of trends) {
      expect(trend.uptime).toBeGreaterThanOrEqual(40);
      expect(trend.uptime).toBeLessThanOrEqual(100);
      expect(trend.patching).toBeGreaterThanOrEqual(40);
      expect(trend.patching).toBeLessThanOrEqual(100);
    }
  });
});
