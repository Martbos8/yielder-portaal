"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { AuthError, ValidationError, DatabaseError, RateLimitError } from "@/lib/errors";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const ContactRequestSchema = z.object({
  companyId: z.string().uuid(),
  subject: z.string().min(1, "Onderwerp is verplicht").max(200, "Onderwerp mag maximaal 200 tekens zijn"),
  message: z.string().max(2000, "Bericht mag maximaal 2000 tekens zijn").optional(),
  productId: z.string().uuid().optional(),
  urgency: z.enum(["normaal", "hoog"]).default("normaal"),
});

export type ContactRequestInput = z.input<typeof ContactRequestSchema>;

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function createContactRequest(input: ContactRequestInput): Promise<ActionResult> {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthError("Niet ingelogd");
  }

  // Rate limit
  const rateLimitKey = `contact_request:${user.id}`;
  const rateResult = checkRateLimit(rateLimitKey, RATE_LIMITS["contactRequest"]);
  if (!rateResult.allowed) {
    throw new RateLimitError(rateResult.resetInMs);
  }

  // Validate input
  const parsed = ContactRequestSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new ValidationError(firstIssue?.message ?? "Ongeldige invoer");
  }

  const { companyId, subject, message, productId, urgency } = parsed.data;

  // Insert contact request
  const { error } = await supabase.from("contact_requests").insert({
    company_id: companyId,
    user_id: user.id,
    subject: subject.trim(),
    message: message?.trim() || null,
    product_id: productId ?? null,
    urgency,
  });

  if (error) {
    throw new DatabaseError(`Contactverzoek opslaan mislukt: ${error.message}`);
  }

  // Audit log (fire-and-forget)
  await logAudit(user.id, "contact_request.created", "contact_request", productId ?? null, {
    company_id: companyId,
    subject: subject.trim(),
    urgency,
    product_id: productId ?? null,
  });

  return { success: true };
}
