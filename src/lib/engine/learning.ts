import { createClient } from "@/lib/supabase/server";
import type { FeedbackAction, RecommendationFeedback } from "@/types/database";

const MIN_DATAPOINTS = 50;
const MIN_MULTIPLIER = 0.5;
const MAX_MULTIPLIER = 2.0;

/**
 * Records a feedback event for a recommendation.
 * Also writes to audit_log for traceability.
 */
export async function recordFeedback(
  companyId: string,
  productId: string,
  action: FeedbackAction,
  recommendationScore: number = 0
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("recommendation_feedback").insert({
    company_id: companyId,
    product_id: productId,
    action,
    recommendation_score: recommendationScore,
  });

  if (error) {
    return;
  }

  // Write audit log entry
  await supabase.from("audit_log").insert({
    action: `recommendation.${action}`,
    entity_type: "recommendation_feedback",
    entity_id: productId,
    details: { company_id: companyId, recommendation_score: recommendationScore },
  });
}

/**
 * Calculates the conversion rate for a product within a segment.
 * Returns the ratio of purchases to shown events.
 */
export async function getConversionRate(
  productId: string,
  segment?: { industry?: string; companySize?: string }
): Promise<number> {
  const supabase = await createClient();

  // Get all feedback for this product
  let query = supabase
    .from("recommendation_feedback")
    .select("action, company_id");

  query = query.eq("product_id", productId);

  const { data } = await query;
  const feedback = (data ?? []) as Pick<RecommendationFeedback, "action" | "company_id">[];

  // If segment filter provided, filter by companies in that segment
  let filteredFeedback = feedback;
  if (segment?.industry || segment?.companySize) {
    const { data: companies } = await supabase.from("companies").select("id, employee_count, industry");
    const companyMap = new Map(
      ((companies ?? []) as { id: string; employee_count: number | null; industry: string | null }[]).map(
        (c) => [c.id, c]
      )
    );

    filteredFeedback = feedback.filter((f) => {
      const company = companyMap.get(f.company_id);
      if (!company) return false;
      if (segment.industry && company.industry !== segment.industry) return false;
      if (segment.companySize) {
        const size = getCompanySize(company.employee_count);
        if (size !== segment.companySize) return false;
      }
      return true;
    });
  }

  return computeConversionRate(filteredFeedback.map((f) => f.action));
}

/**
 * Pure function: computes conversion rate from a list of actions.
 * Returns 1.0 (neutral) if fewer than MIN_DATAPOINTS shown events.
 */
export function computeConversionRate(actions: string[]): number {
  const shown = actions.filter((a) => a === "shown").length;
  const purchased = actions.filter((a) => a === "purchased").length;

  if (shown < MIN_DATAPOINTS) return 1.0; // Not enough data — neutral

  return purchased / shown;
}

/**
 * Pure function: computes a conversion multiplier for adjusting recommendation scores.
 * Returns a value between MIN_MULTIPLIER and MAX_MULTIPLIER.
 * With fewer than MIN_DATAPOINTS, returns 1.0 (no adjustment).
 */
export function computeConversionMultiplier(actions: string[]): number {
  const rate = computeConversionRate(actions);

  // If not enough data, return neutral
  const shown = actions.filter((a) => a === "shown").length;
  if (shown < MIN_DATAPOINTS) return 1.0;

  // Normalize: rate of 0 → 0.5x, rate of ~0.1 (10%) → 1.0x, rate of 0.2+ → 2.0x
  // Linear scale: multiplier = 0.5 + rate * 15, clamped to [0.5, 2.0]
  const multiplier = MIN_MULTIPLIER + rate * 15;
  return Math.min(MAX_MULTIPLIER, Math.max(MIN_MULTIPLIER, multiplier));
}

/**
 * Pure function: adjusts a recommendation score using the conversion multiplier.
 */
export function adjustScore(baseScore: number, actions: string[]): number {
  const multiplier = computeConversionMultiplier(actions);
  return Math.round(baseScore * multiplier);
}

function getCompanySize(employeeCount: number | null): string {
  if (employeeCount === null) return "unknown";
  if (employeeCount < 20) return "small";
  if (employeeCount <= 100) return "medium";
  return "large";
}
