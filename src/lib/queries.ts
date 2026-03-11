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

const PROFILE_COLUMNS = "id, email, full_name, avatar_url, created_at, updated_at";
const COMPANY_COLUMNS = "id, name, cw_company_id, employee_count, industry, region, created_at, updated_at";
const TICKET_COLUMNS = "id, company_id, cw_ticket_id, summary, description, status, priority, contact_name, source, is_closed, cw_created_at, cw_updated_at, created_at, updated_at";
const HARDWARE_COLUMNS = "id, company_id, cw_config_id, name, type, manufacturer, model, serial_number, assigned_to, warranty_expiry, created_at, updated_at";
const AGREEMENT_COLUMNS = "id, company_id, cw_agreement_id, name, type, status, bill_amount, start_date, end_date, created_at, updated_at";
const LICENSE_COLUMNS = "id, company_id, vendor, product_name, license_type, seats_total, seats_used, expiry_date, status, cost_per_seat, created_at, updated_at";
const CONTACT_COLUMNS = "id, company_id, full_name, email, phone, role, created_at, updated_at";
const NOTIFICATION_COLUMNS = "id, company_id, user_id, title, message, type, is_read, link, created_at";
const SYNC_LOG_COLUMNS = "id, entity_type, status, records_synced, records_failed, error_message, started_at, completed_at, created_at";

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .single();

  return data as Profile | null;
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
    .select(COMPANY_COLUMNS)
    .eq("id", data.company_id)
    .single();

  return company as Company | null;
}

export async function getRecentTickets(limit = 5): Promise<Ticket[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select(TICKET_COLUMNS)
    .eq("is_closed", false)
    .order("cw_created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Ticket[];
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select(TICKET_COLUMNS)
    .eq("id", id)
    .single();

  return data as Ticket | null;
}

export async function getTickets(): Promise<Ticket[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select(TICKET_COLUMNS)
    .order("cw_created_at", { ascending: false });

  return (data ?? []) as Ticket[];
}

export async function getHardwareAssets(): Promise<HardwareAsset[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hardware_assets")
    .select(HARDWARE_COLUMNS)
    .order("name", { ascending: true });

  return (data ?? []) as HardwareAsset[];
}

export async function getAgreements(): Promise<Agreement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agreements")
    .select(AGREEMENT_COLUMNS)
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
    .select(AGREEMENT_COLUMNS)
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
    .select(HARDWARE_COLUMNS)
    .not("warranty_expiry", "is", null)
    .lt("warranty_expiry", todayStr)
    .order("warranty_expiry", { ascending: true });

  return (data ?? []) as HardwareAsset[];
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

export async function getLicenses(): Promise<License[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("licenses")
    .select(LICENSE_COLUMNS)
    .order("vendor", { ascending: true })
    .order("product_name", { ascending: true });

  return (data ?? []) as License[];
}

export async function getContacts(): Promise<Contact[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select(CONTACT_COLUMNS)
    .order("full_name", { ascending: true });

  return (data ?? []) as Contact[];
}

export async function getNotifications(
  unreadOnly = false
): Promise<Notification[]> {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .order("created_at", { ascending: false });

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data } = await query;
  return (data ?? []) as Notification[];
}

export async function getSyncStatus(): Promise<SyncLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sync_logs")
    .select(SYNC_LOG_COLUMNS)
    .order("started_at", { ascending: false })
    .limit(10);

  return (data ?? []) as SyncLog[];
}
