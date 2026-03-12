// Recalculate health scores for all companies
// Idempotent: scores are computed from current data, no side effects from duplicate runs

import { createLogger } from "@/lib/logger";
import type { JobResult } from "./types";

const log = createLogger("job:health-calculator");

/**
 * Recalculates health scores for all companies.
 * Fetches tickets and hardware per company, computes scores, and stores them.
 * Safe to run multiple times — always produces the same result from current data.
 */
export async function runHealthCalculator(): Promise<JobResult> {
  const start = Date.now();

  log.info("Health calculator started");

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Get all companies
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name")
      .returns<Array<{ id: string; name: string }>>();

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`);
    }

    if (!companies || companies.length === 0) {
      const duration_ms = Date.now() - start;
      log.info("Health calculator completed — no companies found", { durationMs: duration_ms });

      return {
        job: "calculate-health",
        success: true,
        duration_ms,
        details: { companiesProcessed: 0 },
      };
    }

    const { calculateHealthScores, getOverallScore } = await import("@/lib/health-scores");

    let processed = 0;
    let errors = 0;

    for (const company of companies) {
      try {
        // Fetch tickets for this company
        const { data: tickets } = await supabase
          .from("tickets")
          .select("id, company_id, cw_ticket_id, summary, status, priority, contact_name, source, is_closed, cw_created_at, cw_updated_at, created_at, updated_at")
          .eq("company_id", company.id)
          .eq("is_closed", false)
          .returns<Array<{
            id: string;
            company_id: string;
            cw_ticket_id: number | null;
            summary: string;
            status: string;
            priority: string;
            contact_name: string | null;
            source: string | null;
            is_closed: boolean;
            cw_created_at: string | null;
            cw_updated_at: string | null;
            created_at: string;
            updated_at: string;
          }>>();

        // Fetch hardware for this company
        const { data: hardware } = await supabase
          .from("hardware_assets")
          .select("id, company_id, cw_config_id, name, type, manufacturer, model, serial_number, assigned_to, warranty_expiry, created_at, updated_at")
          .eq("company_id", company.id)
          .returns<Array<{
            id: string;
            company_id: string;
            cw_config_id: number | null;
            name: string;
            type: string;
            manufacturer: string | null;
            model: string | null;
            serial_number: string | null;
            assigned_to: string | null;
            warranty_expiry: string | null;
            created_at: string;
            updated_at: string;
          }>>();

        const scores = calculateHealthScores(
          (tickets ?? []) as Parameters<typeof calculateHealthScores>[0],
          (hardware ?? []) as Parameters<typeof calculateHealthScores>[1]
        );
        const overall = getOverallScore(scores);

        log.debug("Health scores calculated", {
          companyId: company.id,
          overall,
          categories: scores.map((s) => `${s.category}=${s.score}`).join(", "),
        });

        processed++;

        // Store scores in cache for quick retrieval
        const { cache, CacheTTL } = await import("@/lib/cache");
        const scoreData = { scores, overall, calculatedAt: new Date().toISOString() };
        cache.set(`health-scores:${company.id}`, scoreData, CacheTTL.LONG);
      } catch (error) {
        errors++;
        log.warn("Failed to calculate health scores for company", {
          companyId: company.id,
          companyName: company.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const duration_ms = Date.now() - start;

    log.info("Health calculator completed", {
      processed,
      errors,
      totalCompanies: companies.length,
      durationMs: duration_ms,
    });

    return {
      job: "calculate-health",
      success: errors === 0,
      duration_ms,
      details: {
        totalCompanies: companies.length,
        processed,
        errors,
      },
    };
  } catch (error) {
    const duration_ms = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);

    log.error("Health calculator failed", { error, durationMs: duration_ms });

    return {
      job: "calculate-health",
      success: false,
      duration_ms,
      details: {},
      error: message,
    };
  }
}
