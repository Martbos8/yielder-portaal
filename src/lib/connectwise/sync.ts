// ConnectWise sync functions — fetches data from CW API and upserts into Supabase
// In demo mode (no API keys), logs a message and returns early

import { ConnectWiseClient } from "./client";
import type {
  CWCompany,
  CWTicket,
  CWAgreement,
  CWConfiguration,
  CWSyncResult,
} from "./types";

/**
 * Transforms CW ticket status to our internal status.
 */
function mapTicketStatus(status?: string, closedFlag?: boolean): string {
  if (closedFlag) return "closed";
  if (!status) return "open";
  const lower = status.toLowerCase();
  if (lower.includes("close") || lower.includes("resolved")) return "closed";
  if (lower.includes("progress") || lower.includes("work")) return "in_progress";
  return "open";
}

/**
 * Transforms CW priority to our internal priority.
 */
function mapPriority(priority?: string): string {
  if (!priority) return "normal";
  const lower = priority.toLowerCase();
  if (lower.includes("urgent") || lower.includes("critical")) return "urgent";
  if (lower.includes("high")) return "high";
  if (lower.includes("low")) return "low";
  return "normal";
}

/**
 * Transforms CW agreement to determine status.
 */
function mapAgreementStatus(cancelled: boolean, endDate?: string): string {
  if (cancelled) return "cancelled";
  if (endDate && new Date(endDate) < new Date()) return "expired";
  return "active";
}

/**
 * Runs a full sync of all entities from ConnectWise to Supabase.
 * Returns early in demo mode (no API keys configured).
 */
export async function syncAll(): Promise<CWSyncResult[]> {
  const client = new ConnectWiseClient();

  if (!client.isConfigured()) {
    console.log("CW sync: demo modus — geen API key geconfigureerd");
    return [];
  }

  const results: CWSyncResult[] = [];

  results.push(await syncCompanies(client));
  results.push(await syncTickets(client));
  results.push(await syncAgreements(client));
  results.push(await syncConfigurations(client));

  return results;
}

async function syncCompanies(client: ConnectWiseClient): Promise<CWSyncResult> {
  const start = Date.now();
  let synced = 0;
  let errors = 0;

  try {
    const companies = await client.get<CWCompany>("/company/companies");

    // Dynamic import to avoid issues in non-server contexts
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    for (const cw of companies) {
      const { error } = await supabase.from("companies").upsert(
        {
          cw_company_id: cw.id,
          name: cw.name,
          employee_count: cw.numberOfEmployees ?? null,
          industry: cw.market?.name ?? null,
        },
        { onConflict: "cw_company_id" }
      );

      if (error) {
        errors++;
      } else {
        synced++;
      }
    }
  } catch {
    errors++;
  }

  return { entity: "companies", synced, errors, skipped: 0, duration_ms: Date.now() - start };
}

async function syncTickets(client: ConnectWiseClient): Promise<CWSyncResult> {
  const start = Date.now();
  let synced = 0;
  let errors = 0;

  try {
    const tickets = await client.get<CWTicket>("/service/tickets");

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    for (const cw of tickets) {
      // Look up company by cw_company_id
      const companyId = cw.company?.id;
      if (!companyId) {
        errors++;
        continue;
      }

      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("cw_company_id", companyId)
        .single();

      if (!company) {
        errors++;
        continue;
      }

      const { error } = await supabase.from("tickets").upsert(
        {
          company_id: company.id,
          cw_ticket_id: cw.id,
          summary: cw.summary,
          status: mapTicketStatus(cw.status?.name, cw.closedFlag),
          priority: mapPriority(cw.priority?.name),
          contact_name: cw.contact?.name ?? null,
          source: cw.source?.name ?? null,
          is_closed: cw.closedFlag,
          cw_created_at: cw._info?.dateEntered ?? null,
          cw_updated_at: cw._info?.lastUpdated ?? null,
        },
        { onConflict: "cw_ticket_id" }
      );

      if (error) {
        errors++;
      } else {
        synced++;
      }
    }
  } catch {
    errors++;
  }

  return { entity: "tickets", synced, errors, skipped: 0, duration_ms: Date.now() - start };
}

async function syncAgreements(client: ConnectWiseClient): Promise<CWSyncResult> {
  const start = Date.now();
  let synced = 0;
  let errors = 0;

  try {
    const agreements = await client.get<CWAgreement>("/finance/agreements");

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    for (const cw of agreements) {
      const companyId = cw.company?.id;
      if (!companyId) {
        errors++;
        continue;
      }

      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("cw_company_id", companyId)
        .single();

      if (!company) {
        errors++;
        continue;
      }

      const { error } = await supabase.from("agreements").upsert(
        {
          company_id: company.id,
          cw_agreement_id: cw.id,
          name: cw.name,
          type: cw.type?.name ?? null,
          status: mapAgreementStatus(cw.cancelledFlag, cw.endDate),
          bill_amount: cw.billAmount ?? null,
          start_date: cw.startDate ?? null,
          end_date: cw.endDate ?? null,
        },
        { onConflict: "cw_agreement_id" }
      );

      if (error) {
        errors++;
      } else {
        synced++;
      }
    }
  } catch {
    errors++;
  }

  return { entity: "agreements", synced, errors, skipped: 0, duration_ms: Date.now() - start };
}

async function syncConfigurations(client: ConnectWiseClient): Promise<CWSyncResult> {
  const start = Date.now();
  let synced = 0;
  let errors = 0;

  try {
    const configs = await client.get<CWConfiguration>("/company/configurations");

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    for (const cw of configs) {
      const companyId = cw.company?.id;
      if (!companyId) {
        errors++;
        continue;
      }

      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("cw_company_id", companyId)
        .single();

      if (!company) {
        errors++;
        continue;
      }

      const { error } = await supabase.from("hardware_assets").upsert(
        {
          company_id: company.id,
          cw_config_id: cw.id,
          name: cw.name,
          type: cw.type?.name ?? "Overig",
          manufacturer: cw.manufacturer?.name ?? null,
          model: cw.model ?? null,
          serial_number: cw.serialNumber ?? null,
          assigned_to: cw.contact?.name ?? null,
          warranty_expiry: cw.warrantyExpirationDate ?? null,
        },
        { onConflict: "cw_config_id" }
      );

      if (error) {
        errors++;
      } else {
        synced++;
      }
    }
  } catch {
    errors++;
  }

  return { entity: "hardware_assets", synced, errors, skipped: 0, duration_ms: Date.now() - start };
}

// Export mapping functions for testing
export { mapTicketStatus, mapPriority, mapAgreementStatus };
