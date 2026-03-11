import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getRecommendations } from "@/lib/engine/recommendation";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/recommendations/[companyId]
 * Returns product recommendations for a company. Auth + RLS check.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;

  if (!UUID_REGEX.test(companyId)) {
    return NextResponse.json({ error: "Ongeldig bedrijfs-ID" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const rateResult = checkRateLimit(`recommendations:${user.id}`, RATE_LIMITS.apiCall);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Te veel verzoeken" },
      { status: 429 }
    );
  }

  // RLS check: user must belong to this company
  const { data: mapping } = await supabase
    .from("user_company_mapping")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .single();

  if (!mapping) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const recommendations = await getRecommendations(companyId);

  return NextResponse.json({ recommendations });
}
