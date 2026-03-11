"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { AuthError, ValidationError, DatabaseError } from "@/lib/errors";

const FeedbackSchema = z.object({
  companyId: z.string().uuid(),
  productId: z.string().uuid(),
  action: z.enum(["shown", "clicked", "contacted", "purchased", "dismissed"]),
  recommendationScore: z.number().min(0).max(100).default(0),
});

export type FeedbackInput = z.input<typeof FeedbackSchema>;

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function recordRecommendationFeedback(input: FeedbackInput): Promise<ActionResult> {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthError("Niet ingelogd");
  }

  // Validate
  const parsed = FeedbackSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new ValidationError(firstIssue?.message ?? "Ongeldige feedback invoer");
  }

  const { companyId, productId, action, recommendationScore } = parsed.data;

  const { error } = await supabase.from("recommendation_feedback").insert({
    company_id: companyId,
    product_id: productId,
    action,
    recommendation_score: recommendationScore,
  });

  if (error) {
    throw new DatabaseError(`Feedback opslaan mislukt: ${error.message}`);
  }

  // Audit log
  await logAudit(user.id, `recommendation.${action}`, "recommendation_feedback", productId, {
    company_id: companyId,
    recommendation_score: recommendationScore,
  });

  return { success: true };
}
