import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/errors";
import { createLogger, withTiming } from "@/lib/logger";
import type { Profile, Company, Contact, DashboardStats } from "@/types/database";

const log = createLogger("repo:company");

const PROFILE_COLUMNS = "id, email, full_name, avatar_url, is_yielder, created_at, updated_at" as const;
const COMPANY_COLUMNS = "id, cw_company_id, name, employee_count, industry, region, created_at, updated_at" as const;
const CONTACT_COLUMNS = "id, company_id, full_name, email, phone, role, created_at, updated_at" as const;

/** Fetch the authenticated user's profile. */
export async function getUserProfile(): Promise<Profile | null> {
  return withTiming(log, "getUserProfile", async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .returns<Profile[]>()
      .single();

    if (error && error.code !== "PGRST116") {
      throw new DatabaseError(`Failed to fetch user profile: ${error.message}`);
    }
    return data;
  });
}

/** Get the company ID for the authenticated user. */
export async function getUserCompanyId(): Promise<string | null> {
  return withTiming(log, "getUserCompanyId", async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_company_mapping")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new DatabaseError(`Failed to fetch user company mapping: ${error.message}`);
    }
    return data?.company_id ?? null;
  });
}

/** Fetch the authenticated user's company. */
export async function getUserCompany(): Promise<Company | null> {
  return withTiming(log, "getUserCompany", async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error: mappingError } = await supabase
      .from("user_company_mapping")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (mappingError && mappingError.code !== "PGRST116") {
      throw new DatabaseError(`Failed to fetch user company mapping: ${mappingError.message}`);
    }
    if (!data) return null;

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select(COMPANY_COLUMNS)
      .eq("id", data.company_id)
      .returns<Company[]>()
      .single();

    if (companyError && companyError.code !== "PGRST116") {
      throw new DatabaseError(`Failed to fetch company: ${companyError.message}`);
    }
    return company;
  });
}

/** Fetch contacts for the user's company, ordered by name. */
export async function getContacts(): Promise<Contact[]> {
  return withTiming(log, "getContacts", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contacts")
      .select(CONTACT_COLUMNS)
      .order("full_name", { ascending: true })
      .returns<Contact[]>();

    if (error) throw new DatabaseError(`Failed to fetch contacts: ${error.message}`);
    return data ?? [];
  });
}

/** Fetch aggregated dashboard statistics. */
export async function getDashboardStats(): Promise<DashboardStats> {
  return withTiming(log, "getDashboardStats", async () => {
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

    if (ticketsRes.error) throw new DatabaseError(`Failed to fetch ticket stats: ${ticketsRes.error.message}`);
    if (hardwareRes.error) throw new DatabaseError(`Failed to fetch hardware stats: ${hardwareRes.error.message}`);
    if (agreementsRes.error) throw new DatabaseError(`Failed to fetch agreement stats: ${agreementsRes.error.message}`);

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
  });
}
