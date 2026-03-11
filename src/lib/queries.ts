import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Company,
  Ticket,
  HardwareAsset,
  Agreement,
  DashboardStats,
} from "@/types/database";

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}

export async function getUserCompany(): Promise<Company | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_company_mapping")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!data) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", data.company_id)
    .single();

  return company as Company | null;
}

export async function getRecentTickets(limit = 5): Promise<Ticket[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("is_closed", false)
    .order("cw_created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Ticket[];
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  return data as Ticket | null;
}

export async function getTickets(): Promise<Ticket[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .order("cw_created_at", { ascending: false });

  return (data ?? []) as Ticket[];
}

export async function getHardwareAssets(): Promise<HardwareAsset[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hardware_assets")
    .select("*")
    .order("name", { ascending: true });

  return (data ?? []) as HardwareAsset[];
}

export async function getAgreements(): Promise<Agreement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agreements")
    .select("*")
    .order("status", { ascending: true })
    .order("name", { ascending: true });

  return (data ?? []) as Agreement[];
}

export async function getExpiringAgreements(
  withinDays = 30
): Promise<Agreement[]> {
  const supabase = await createClient();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + withinDays);
  const futureDateStr = futureDate.toISOString().split("T")[0];

  const { data } = await supabase
    .from("agreements")
    .select("*")
    .eq("status", "active")
    .not("end_date", "is", null)
    .lte("end_date", futureDateStr)
    .order("end_date", { ascending: true });

  return (data ?? []) as Agreement[];
}

export async function getExpiredWarrantyHardware(): Promise<HardwareAsset[]> {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("hardware_assets")
    .select("*")
    .not("warranty_expiry", "is", null)
    .lt("warranty_expiry", todayStr)
    .order("warranty_expiry", { ascending: true });

  return (data ?? []) as HardwareAsset[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [ticketsRes, hardwareRes, agreementsRes] = await Promise.all([
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("is_closed", false),
    supabase
      .from("hardware_assets")
      .select("id", { count: "exact", head: true }),
    supabase.from("agreements").select("status, bill_amount"),
  ]);

  const activeAgreements = (agreementsRes.data ?? []).filter(
    (a: { status: string; bill_amount: number | null }) =>
      a.status === "active"
  );
  const monthlyAmount = activeAgreements.reduce(
    (sum: number, a: { status: string; bill_amount: number | null }) =>
      sum + (a.bill_amount ?? 0),
    0
  );

  return {
    openTickets: ticketsRes.count ?? 0,
    hardwareCount: hardwareRes.count ?? 0,
    activeContracts: activeAgreements.length,
    monthlyAmount,
  };
}
