import type { Ticket, HardwareAsset } from "@/types/database";

export type HealthCategory = "uptime" | "patching" | "backups" | "security";

export type HealthScore = {
  category: HealthCategory;
  label: string;
  score: number; // 0-100
  icon: string;
  description: string;
};

export type HealthTrend = {
  month: string;
  uptime: number;
  patching: number;
  backups: number;
  security: number;
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Uitstekend";
  if (score >= 80) return "Goed";
  if (score >= 60) return "Voldoende";
  if (score >= 40) return "Matig";
  return "Onvoldoende";
}

export function getScoreColorClass(score: number): string {
  return getScoreColor(score);
}

export function getScoreLabelText(score: number): string {
  return getScoreLabel(score);
}

export function getScoreRingColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#eab308";
  return "#ef4444";
}

/**
 * Calculate health scores based on ticket and hardware data.
 * In production these would come from monitoring systems;
 * here we derive estimates from available data.
 */
export function calculateHealthScores(
  tickets: Ticket[],
  hardware: HardwareAsset[]
): HealthScore[] {
  const uptimeScore = calculateUptimeScore(tickets);
  const patchingScore = calculatePatchingScore(hardware);
  const backupScore = calculateBackupScore(tickets);
  const securityScore = calculateSecurityScore(tickets, hardware);

  return [
    {
      category: "uptime",
      label: "Uptime",
      score: uptimeScore,
      icon: "cloud_done",
      description: "Beschikbaarheid van uw systemen",
    },
    {
      category: "patching",
      label: "Patching",
      score: patchingScore,
      icon: "system_update_alt",
      description: "Update-status van uw apparaten",
    },
    {
      category: "backups",
      label: "Backups",
      score: backupScore,
      icon: "backup",
      description: "Betrouwbaarheid van uw back-ups",
    },
    {
      category: "security",
      label: "Security",
      score: securityScore,
      icon: "shield",
      description: "Beveiligingsniveau van uw omgeving",
    },
  ];
}

function calculateUptimeScore(tickets: Ticket[]): number {
  // Fewer urgent/high tickets about downtime = higher uptime
  const downtimeTickets = tickets.filter(
    (t) =>
      !t.is_closed &&
      (t.priority === "urgent" || t.priority === "high")
  );
  const penalty = downtimeTickets.length * 5;
  return Math.max(60, Math.min(100, 98 - penalty));
}

function calculatePatchingScore(hardware: HardwareAsset[]): number {
  if (hardware.length === 0) return 85;
  const now = new Date();
  const outdated = hardware.filter((h) => {
    if (!h.warranty_expiry) return false;
    const expiry = new Date(h.warranty_expiry);
    return expiry < now;
  });
  const ratio = outdated.length / hardware.length;
  return Math.max(40, Math.round(95 - ratio * 60));
}

function calculateBackupScore(tickets: Ticket[]): number {
  // Check for backup-related open tickets
  const backupIssues = tickets.filter(
    (t) =>
      !t.is_closed &&
      t.summary.toLowerCase().includes("backup")
  );
  const penalty = backupIssues.length * 10;
  return Math.max(50, Math.min(100, 95 - penalty));
}

function calculateSecurityScore(
  tickets: Ticket[],
  hardware: HardwareAsset[]
): number {
  // Security issues + expired warranty hardware
  const securityTickets = tickets.filter(
    (t) =>
      !t.is_closed &&
      (t.summary.toLowerCase().includes("security") ||
        t.summary.toLowerCase().includes("beveilig") ||
        t.summary.toLowerCase().includes("virus") ||
        t.summary.toLowerCase().includes("malware"))
  );
  const now = new Date();
  const expiredWarranty = hardware.filter((h) => {
    if (!h.warranty_expiry) return false;
    return new Date(h.warranty_expiry) < now;
  });
  const ticketPenalty = securityTickets.length * 8;
  const warrantyPenalty = Math.min(15, expiredWarranty.length * 3);
  return Math.max(40, Math.min(100, 92 - ticketPenalty - warrantyPenalty));
}

/**
 * Generate trend data for the past 6 months.
 * In production this would query historical data;
 * here we generate realistic trends based on current scores.
 */
export function generateHealthTrends(
  currentScores: HealthScore[]
): HealthTrend[] {
  const months = getLastSixMonths();
  const scoreMap = Object.fromEntries(
    currentScores.map((s) => [s.category, s.score])
  );

  return months.map((month, index) => {
    const progress = (index + 1) / months.length;
    return {
      month,
      uptime: Math.round(
        interpolateScore(scoreMap['uptime'] ?? 90, progress, 3)
      ),
      patching: Math.round(
        interpolateScore(scoreMap['patching'] ?? 80, progress, 5)
      ),
      backups: Math.round(
        interpolateScore(scoreMap['backups'] ?? 85, progress, 4)
      ),
      security: Math.round(
        interpolateScore(scoreMap['security'] ?? 88, progress, 3)
      ),
    };
  });
}

function interpolateScore(
  current: number,
  progress: number,
  variance: number
): number {
  const base = current - 8 + progress * 8;
  const jitter = (Math.sin(progress * 12) * variance);
  return Math.max(40, Math.min(100, base + jitter));
}

function getLastSixMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      date.toLocaleDateString("nl-NL", { month: "short", year: "numeric" })
    );
  }
  return months;
}

export function getOverallScore(scores: HealthScore[]): number {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, s) => sum + s.score, 0);
  return Math.round(total / scores.length);
}
