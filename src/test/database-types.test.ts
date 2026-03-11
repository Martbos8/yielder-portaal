import { describe, it, expect } from "vitest";
import type {
  Company,
  Profile,
  Ticket,
  HardwareAsset,
  Agreement,
  Contact,
  DashboardStats,
} from "@/types/database";

describe("Database types", () => {
  it("types are importable and structurally correct", () => {
    // Verify types compile and can be used
    const company: Company = {
      id: "1",
      name: "Test B.V.",
      cw_company_id: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    expect(company.name).toBe("Test B.V.");

    const profile: Profile = {
      id: "1",
      email: "test@example.com",
      full_name: "Test User",
      avatar_url: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    expect(profile.email).toBe("test@example.com");

    const ticket: Ticket = {
      id: "1",
      company_id: "1",
      cw_ticket_id: 100,
      summary: "Test ticket",
      description: null,
      status: "open",
      priority: "normal",
      contact_name: null,
      source: null,
      is_closed: false,
      cw_created_at: null,
      cw_updated_at: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    expect(ticket.status).toBe("open");

    const asset: HardwareAsset = {
      id: "1",
      company_id: "1",
      cw_config_id: null,
      name: "ThinkPad X1",
      type: "Laptop",
      manufacturer: "Lenovo",
      model: "X1 Carbon",
      serial_number: "SN123",
      assigned_to: null,
      warranty_expiry: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    expect(asset.type).toBe("Laptop");

    const agreement: Agreement = {
      id: "1",
      company_id: "1",
      cw_agreement_id: null,
      name: "Managed Services",
      type: "SLA",
      status: "active",
      bill_amount: 1500,
      start_date: "2026-01-01",
      end_date: "2027-01-01",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    expect(agreement.bill_amount).toBe(1500);

    const contact: Contact = {
      id: "1",
      company_id: "1",
      full_name: "Jan de Vries",
      email: "jan@test.nl",
      phone: null,
      role: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    expect(contact.full_name).toBe("Jan de Vries");

    const stats: DashboardStats = {
      openTickets: 5,
      hardwareCount: 12,
      activeContracts: 3,
      monthlyAmount: 4500,
    };
    expect(stats.openTickets).toBe(5);
  });
});

describe("Query functions", () => {
  it("query functions are exportable", async () => {
    const queries = await import("@/lib/queries");
    expect(typeof queries.getUserProfile).toBe("function");
    expect(typeof queries.getUserCompany).toBe("function");
    expect(typeof queries.getTickets).toBe("function");
    expect(typeof queries.getHardwareAssets).toBe("function");
    expect(typeof queries.getAgreements).toBe("function");
    expect(typeof queries.getDashboardStats).toBe("function");
  });
});
