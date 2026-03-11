import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Company,
  Ticket,
  HardwareAsset,
  Agreement,
  DashboardStats,
  License,
  Contact,
  Notification,
  SyncLog,
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
    .returns<Profile[]>()
    .single();

  return data;
}

export async function getUserCompanyId(): Promise<string | null> {
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

  return data?.company_id ?? null;
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
    .returns<Company[]>()
    .single();

  return company;
}

export async function getRecentTickets(limit = 5): Promise<Ticket[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("is_closed", false)
    .order("cw_created_at", { ascending: false })
    .limit(limit)
    .returns<Ticket[]>();

  return data ?? [];
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .returns<Ticket[]>()
    .single();

  return data;
}

export async function getTickets(): Promise<Ticket[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .order("cw_created_at", { ascending: false })
    .returns<Ticket[]>();

  return data ?? [];
}

export async function getHardwareAssets(): Promise<HardwareAsset[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hardware_assets")
    .select("*")
    .order("name", { ascending: true })
    .returns<HardwareAsset[]>();

  return data ?? [];
}

export async function getAgreements(): Promise<Agreement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agreements")
    .select("*")
    .order("status", { ascending: true })
    .order("name", { ascending: true })
    .returns<Agreement[]>();

  return data ?? [];
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
    .lte("end_date", futureDateStr!)
    .order("end_date", { ascending: true })
    .returns<Agreement[]>();

  return data ?? [];
}

export async function getExpiredWarrantyHardware(): Promise<HardwareAsset[]> {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("hardware_assets")
    .select("*")
    .not("warranty_expiry", "is", null)
    .lt("warranty_expiry", todayStr!)
    .order("warranty_expiry", { ascending: true })
    .returns<HardwareAsset[]>();

  return data ?? [];
}

export async function getOpenTicketCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("is_closed", false);

  return count ?? 0;
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
    (a) => a.status === "active"
  );
  const monthlyAmount = activeAgreements.reduce(
    (sum, a) => sum + (a.bill_amount ?? 0),
    0
  );

  return {
    openTickets: ticketsRes.count ?? 0,
    hardwareCount: hardwareRes.count ?? 0,
    activeContracts: activeAgreements.length,
    monthlyAmount,
  };
}

export async function getLicenses(): Promise<License[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("licenses")
    .select("*")
    .order("vendor", { ascending: true })
    .order("product_name", { ascending: true })
    .returns<License[]>();

  return data ?? [];
}

export async function getContacts(): Promise<Contact[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .order("full_name", { ascending: true })
    .returns<Contact[]>();

  return data ?? [];
}

export async function getNotifications(
  unreadOnly = false
): Promise<Notification[]> {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data } = await query.returns<Notification[]>();
  return data ?? [];
}

export async function getSyncStatus(): Promise<SyncLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sync_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(10)
    .returns<SyncLog[]>();

  return data ?? [];
}
