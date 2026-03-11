// Transform functions: ConnectWise JSON → Supabase schema
// Each function maps external API data to our internal database types

import type {
  CWTicket,
  CWAgreement,
  CWConfiguration,
  CWCompany,
} from "@/lib/connectwise/types";
import type { TransformFunction } from "./types";

// --- Output types (Supabase row shapes for upsert) ---

type CompanyUpsert = {
  cw_company_id: number;
  name: string;
  employee_count: number | null;
  industry: string | null;
};

type TicketUpsert = {
  company_id: string;
  cw_ticket_id: number;
  summary: string;
  status: string;
  priority: string;
  contact_name: string | null;
  source: string | null;
  is_closed: boolean;
  cw_created_at: string | null;
  cw_updated_at: string | null;
};

type AgreementUpsert = {
  company_id: string;
  cw_agreement_id: number;
  name: string;
  type: string | null;
  status: string;
  bill_amount: number | null;
  start_date: string | null;
  end_date: string | null;
};

type HardwareUpsert = {
  company_id: string;
  cw_config_id: number;
  name: string;
  type: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  assigned_to: string | null;
  warranty_expiry: string | null;
};

// --- Mapping helpers ---

function mapTicketStatus(status?: string, closedFlag?: boolean): string {
  if (closedFlag) return "closed";
  if (!status) return "open";
  const lower = status.toLowerCase();
  if (lower.includes("close") || lower.includes("resolved")) return "closed";
  if (lower.includes("progress") || lower.includes("work")) return "in_progress";
  return "open";
}

function mapPriority(priority?: string): string {
  if (!priority) return "normal";
  const lower = priority.toLowerCase();
  if (lower.includes("urgent") || lower.includes("critical")) return "urgent";
  if (lower.includes("high")) return "high";
  if (lower.includes("low")) return "low";
  return "normal";
}

function mapAgreementStatus(cancelled: boolean, endDate?: string): string {
  if (cancelled) return "cancelled";
  if (endDate && new Date(endDate) < new Date()) return "expired";
  return "active";
}

function mapHardwareType(typeName?: string): string {
  if (!typeName) return "Overig";
  const lower = typeName.toLowerCase();
  if (lower.includes("laptop")) return "Laptop";
  if (lower.includes("desktop") || lower.includes("workstation")) return "Desktop";
  if (lower.includes("server")) return "Server";
  if (lower.includes("netwerk") || lower.includes("network") || lower.includes("switch") || lower.includes("router") || lower.includes("firewall")) return "Netwerk";
  return "Overig";
}

// --- Transform functions ---

export const transformCompany: TransformFunction<CWCompany, CompanyUpsert> = (
  source
) => {
  return {
    cw_company_id: source.id,
    name: source.name,
    employee_count: source.numberOfEmployees ?? null,
    industry: source.market?.name ?? null,
  };
};

export const transformTicket: TransformFunction<CWTicket, TicketUpsert> = (
  source,
  context
) => {
  const cwCompanyId = source.company?.id;
  if (!cwCompanyId) return null;

  const companyId = context.companyIdMap.get(cwCompanyId);
  if (!companyId) return null;

  return {
    company_id: companyId,
    cw_ticket_id: source.id,
    summary: source.summary,
    status: mapTicketStatus(source.status?.name, source.closedFlag),
    priority: mapPriority(source.priority?.name),
    contact_name: source.contact?.name ?? null,
    source: source.source?.name ?? null,
    is_closed: source.closedFlag,
    cw_created_at: source._info?.dateEntered ?? null,
    cw_updated_at: source._info?.lastUpdated ?? null,
  };
};

export const transformAgreement: TransformFunction<
  CWAgreement,
  AgreementUpsert
> = (source, context) => {
  const cwCompanyId = source.company?.id;
  if (!cwCompanyId) return null;

  const companyId = context.companyIdMap.get(cwCompanyId);
  if (!companyId) return null;

  return {
    company_id: companyId,
    cw_agreement_id: source.id,
    name: source.name,
    type: source.type?.name ?? null,
    status: mapAgreementStatus(source.cancelledFlag, source.endDate),
    bill_amount: source.billAmount ?? null,
    start_date: source.startDate ?? null,
    end_date: source.endDate ?? null,
  };
};

export const transformHardware: TransformFunction<
  CWConfiguration,
  HardwareUpsert
> = (source, context) => {
  const cwCompanyId = source.company?.id;
  if (!cwCompanyId) return null;

  const companyId = context.companyIdMap.get(cwCompanyId);
  if (!companyId) return null;

  return {
    company_id: companyId,
    cw_config_id: source.id,
    name: source.name,
    type: mapHardwareType(source.type?.name),
    manufacturer: source.manufacturer?.name ?? null,
    model: source.model ?? null,
    serial_number: source.serialNumber ?? null,
    assigned_to: source.contact?.name ?? null,
    warranty_expiry: source.warrantyExpirationDate ?? null,
  };
};

// Export mapping helpers for testing
export { mapTicketStatus, mapPriority, mapAgreementStatus, mapHardwareType };
