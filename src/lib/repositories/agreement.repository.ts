import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/errors";
import type { Agreement } from "@/types/database";

const AGREEMENT_COLUMNS = "id, company_id, cw_agreement_id, name, type, status, bill_amount, start_date, end_date, created_at, updated_at" as const;

/** Fetch all agreements, ordered by status then name. */
export async function getAgreements(): Promise<Agreement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agreements")
    .select(AGREEMENT_COLUMNS)
    .order("status", { ascending: true })
    .order("name", { ascending: true })
    .returns<Agreement[]>();

  if (error) throw new DatabaseError(`Failed to fetch agreements: ${error.message}`);
  return data ?? [];
}

/** Fetch active agreements expiring within `withinDays` days. */
export async function getExpiringAgreements(withinDays = 30): Promise<Agreement[]> {
  const supabase = await createClient();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + withinDays);
  const futureDateStr = futureDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("agreements")
    .select(AGREEMENT_COLUMNS)
    .eq("status", "active")
    .not("end_date", "is", null)
    .lte("end_date", futureDateStr!)
    .order("end_date", { ascending: true })
    .returns<Agreement[]>();

  if (error) throw new DatabaseError(`Failed to fetch expiring agreements: ${error.message}`);
  return data ?? [];
}
