import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/errors";
import type { HardwareAsset } from "@/types/database";

const HARDWARE_COLUMNS = "id, company_id, cw_config_id, name, type, manufacturer, model, serial_number, assigned_to, warranty_expiry, created_at, updated_at" as const;

/** Fetch all hardware assets, ordered by name. */
export async function getHardwareAssets(): Promise<HardwareAsset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hardware_assets")
    .select(HARDWARE_COLUMNS)
    .order("name", { ascending: true })
    .returns<HardwareAsset[]>();

  if (error) throw new DatabaseError(`Failed to fetch hardware assets: ${error.message}`);
  return data ?? [];
}

/** Fetch hardware with expired warranties. */
export async function getExpiredWarrantyHardware(): Promise<HardwareAsset[]> {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("hardware_assets")
    .select(HARDWARE_COLUMNS)
    .not("warranty_expiry", "is", null)
    .lt("warranty_expiry", todayStr!)
    .order("warranty_expiry", { ascending: true })
    .returns<HardwareAsset[]>();

  if (error) throw new DatabaseError(`Failed to fetch expired warranty hardware: ${error.message}`);
  return data ?? [];
}
