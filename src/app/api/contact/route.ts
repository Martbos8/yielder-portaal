import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSubject, sanitizeMessage } from "@/lib/sanitize";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_URGENCIES = new Set(["normaal", "hoog"]);

/**
 * POST /api/contact
 * Submit a contact request. Requires authentication.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  // Rate limit per user
  const rateLimitKey = `contact:${user.id}`;
  const rateResult = checkRateLimit(rateLimitKey, RATE_LIMITS.contactRequest);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Te veel verzoeken, probeer later opnieuw" },
      { status: 429 }
    );
  }

  // Get company_id
  const { data: mapping } = await supabase
    .from("user_company_mapping")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!mapping?.company_id) {
    return NextResponse.json(
      { error: "Geen bedrijf gekoppeld" },
      { status: 403 }
    );
  }

  // Parse and validate body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ongeldige JSON" },
      { status: 400 }
    );
  }

  const { subject, message, urgency, product_id } = body as {
    subject: unknown;
    message: unknown;
    urgency: unknown;
    product_id: unknown;
  };

  // Validate subject
  if (typeof subject !== "string" || subject.trim().length === 0) {
    return NextResponse.json(
      { error: "Onderwerp is verplicht" },
      { status: 400 }
    );
  }
  if (subject.length > 200) {
    return NextResponse.json(
      { error: "Onderwerp mag maximaal 200 tekens zijn" },
      { status: 400 }
    );
  }

  // Validate message
  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Bericht is verplicht" },
      { status: 400 }
    );
  }
  if (message.trim().length < 10) {
    return NextResponse.json(
      { error: "Bericht moet minimaal 10 tekens zijn" },
      { status: 400 }
    );
  }
  if (message.length > 2000) {
    return NextResponse.json(
      { error: "Bericht mag maximaal 2000 tekens zijn" },
      { status: 400 }
    );
  }

  // Validate urgency
  const urgencyValue: "normaal" | "hoog" = (typeof urgency === "string" && urgency === "hoog") ? "hoog" : "normaal";
  if (!VALID_URGENCIES.has(urgencyValue)) {
    return NextResponse.json(
      { error: "Urgentie moet 'normaal' of 'hoog' zijn" },
      { status: 400 }
    );
  }

  // Validate product_id (optional)
  if (product_id !== undefined && product_id !== null) {
    if (typeof product_id !== "string" || !UUID_REGEX.test(product_id)) {
      return NextResponse.json(
        { error: "Ongeldig product ID" },
        { status: 400 }
      );
    }
  }

  // Sanitize
  const cleanSubject = sanitizeSubject(subject);
  const cleanMessage = sanitizeMessage(message);

  // Insert
  const { data, error } = await supabase
    .from("contact_requests")
    .insert({
      company_id: mapping.company_id,
      user_id: user.id,
      subject: cleanSubject,
      message: cleanMessage,
      urgency: urgencyValue,
      product_id: product_id ?? null,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Opslaan mislukt" },
      { status: 500 }
    );
  }

  await logAudit(user.id, "contact_request_created", "contact_request", data.id, {
    subject: cleanSubject,
    urgency: urgencyValue,
  });

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
