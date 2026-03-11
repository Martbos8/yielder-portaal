import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/errors";
import type { License } from "@/types/database";

const LICENSE_COLUMNS = "id, company_id, vendor, product_name, license_type, seats_total, seats_used, expiry_date, status, cost_per_seat, created_at, updated_at" as const;

/** Fetch all licenses, ordered by vendor then product name. */
export async function getLicenses(): Promise<License[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("licenses")
    .select(LICENSE_COLUMNS)
    .order("vendor", { ascending: true })
    .order("product_name", { ascending: true })
    .returns<License[]>();

  if (error) throw new DatabaseError(`Failed to fetch licenses: ${error.message}`);
  return data ?? [];
}
