// Generate notifications for contract expiry, warranty expiry, etc.
// Idempotent: checks for existing notifications before creating duplicates

import { createLogger } from "@/lib/logger";
import type { JobResult } from "./types";

const log = createLogger("job:notification-generator");

/** Days before expiry to send different notification tiers */
const EXPIRY_THRESHOLDS = [7, 30, 60] as const;

/**
 * Generates a deterministic notification key to prevent duplicates.
 * Based on entity type, entity ID, and threshold.
 */
function notificationKey(entityType: string, entityId: string, thresholdDays: number): string {
  return `${entityType}:${entityId}:${thresholdDays}d`;
}

/**
 * Generates notifications for upcoming contract expirations and warranty expiry.
 * Checks existing notifications to avoid duplicates.
 */
export async function runNotificationGenerator(): Promise<JobResult> {
  const start = Date.now();

  log.info("Notification generator started");

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    let generated = 0;
    let skipped = 0;

    // --- Contract expiry notifications ---
    const { getExpiringAgreements } = await import("@/lib/repositories/agreement.repository");
    const expiringAgreements = await getExpiringAgreements(60);

    for (const agreement of expiringAgreements) {
      if (!agreement.end_date || !agreement.company_id) continue;

      const daysUntilExpiry = Math.ceil(
        (new Date(agreement.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Find the matching threshold
      const threshold = EXPIRY_THRESHOLDS.find((t) => daysUntilExpiry <= t);
      if (threshold === undefined) continue;

      const key = notificationKey("agreement", agreement.id, threshold);

      // Check if this notification already exists (idempotency)
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("company_id", agreement.company_id)
        .eq("type", "warning")
        .like("message", `%${agreement.name}%${threshold}%`)
        .limit(1)
        .returns<Array<{ id: string }>>();

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const urgencyLabel = threshold <= 7 ? "dringend" : threshold <= 30 ? "binnenkort" : "gepland";
      const title = `Contract verloopt ${urgencyLabel}`;
      const message = `Contract "${agreement.name}" verloopt over ${daysUntilExpiry} dagen (${threshold}-dagen waarschuwing).`;

      const { error } = await supabase.from("notifications").insert({
        company_id: agreement.company_id,
        title,
        message,
        type: "warning",
        is_read: false,
        link: `/contracten`,
      });

      if (error) {
        log.warn("Failed to create contract expiry notification", {
          agreementId: agreement.id,
          key,
          error: error.message,
        });
      } else {
        generated++;
      }
    }

    // --- Warranty expiry notifications ---
    const { getExpiredWarrantyHardware } = await import("@/lib/repositories/hardware.repository");
    const expiredHardware = await getExpiredWarrantyHardware();

    // Group by company to avoid flooding
    const byCompany = new Map<string, Array<{ id: string; name: string; warranty_expiry: string }>>();
    for (const hw of expiredHardware) {
      if (!hw.company_id || !hw.warranty_expiry) continue;
      const list = byCompany.get(hw.company_id) ?? [];
      list.push({ id: hw.id, name: hw.name, warranty_expiry: hw.warranty_expiry });
      byCompany.set(hw.company_id, list);
    }

    for (const [companyId, devices] of Array.from(byCompany.entries())) {
      // Check if we already notified about warranty expiry this month
      const monthKey = new Date().toISOString().slice(0, 7); // "2026-03"
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("company_id", companyId)
        .eq("type", "alert")
        .gte("created_at", `${monthKey}-01`)
        .limit(1)
        .returns<Array<{ id: string }>>();

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const count = devices.length;
      const title = "Verlopen garanties";
      const message = count === 1
        ? `Apparaat "${devices[0]!.name}" heeft een verlopen garantie.`
        : `${count} apparaten hebben een verlopen garantie.`;

      const { error } = await supabase.from("notifications").insert({
        company_id: companyId,
        title,
        message,
        type: "alert",
        is_read: false,
        link: `/hardware`,
      });

      if (error) {
        log.warn("Failed to create warranty expiry notification", {
          companyId,
          error: error.message,
        });
      } else {
        generated++;
      }
    }

    const duration_ms = Date.now() - start;

    log.info("Notification generator completed", {
      generated,
      skipped,
      durationMs: duration_ms,
    });

    return {
      job: "generate-notifications",
      success: true,
      duration_ms,
      details: {
        generated,
        skipped,
        expiringAgreements: expiringAgreements.length,
        expiredHardwareCompanies: byCompany.size,
      },
    };
  } catch (error) {
    const duration_ms = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);

    log.error("Notification generator failed", { error, durationMs: duration_ms });

    return {
      job: "generate-notifications",
      success: false,
      duration_ms,
      details: {},
      error: message,
    };
  }
}
