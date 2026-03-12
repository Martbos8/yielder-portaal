import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Koppel user aan bedrijf op basis van metadata uit login
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const companyId = user.user_metadata?.["company_id"] as string | undefined;
        if (companyId) {
          // Verwijder oude mappings en maak nieuwe
          await supabase
            .from("user_company_mapping")
            .delete()
            .eq("user_id", user.id);
          await supabase
            .from("user_company_mapping")
            .insert({ user_id: user.id, company_id: companyId });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth fout → terug naar root (HTML handles login)
  return NextResponse.redirect(`${origin}/`);
}
