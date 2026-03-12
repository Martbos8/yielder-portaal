/**
 * Integration test: complete user flow.
 * Tests the chain: login → dashboard → tickets → ticket detail → back.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  }),
  withTiming: async (_l: unknown, _n: string, fn: () => Promise<unknown>) => fn(),
}));

import { createClient } from "@/lib/supabase/server";

const mockedCreateClient = vi.mocked(createClient);

/** Chainable Supabase mock that resolves to the given result. */
function chain(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const r = { data: result.data ?? null, error: result.error ?? null, count: result.count ?? null };
  const methods = ["select", "insert", "update", "eq", "neq", "lt", "lte", "gt", "gte",
    "not", "or", "in", "order", "limit", "returns", "is", "range", "ilike", "maybeSingle"];
  const obj: Record<string, unknown> = {};
  const proxy: unknown = new Proxy(obj, {
    get(t, p) {
      if (p === "then") return (ok: (v: unknown) => void, fail: (v: unknown) => void) => Promise.resolve(r).then(ok, fail);
      return (t as Record<string | symbol, unknown>)[p];
    },
  });
  for (const m of methods) obj[m] = vi.fn().mockReturnValue(proxy);
  // .single() returns first array element, matching real Supabase
  const sd = Array.isArray(r.data) ? (r.data[0] ?? null) : r.data;
  obj["single"] = vi.fn().mockResolvedValue({ ...r, data: sd });
  return proxy;
}

const UUID_USER = "11111111-1111-4111-8111-111111111111";
const UUID_COMPANY = "22222222-2222-4222-8222-222222222222";

const testUser = { id: UUID_USER, email: "test@bedrijf.nl" };

const testProfile = {
  id: UUID_USER,
  full_name: "Jan Tester",
  email: "test@bedrijf.nl",
  is_yielder: false,
  avatar_url: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const testCompany = {
  id: UUID_COMPANY,
  name: "Test BV",
  cw_company_id: 100,
  size: "small",
  industry: "IT",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const testTickets = [
  {
    id: "ticket-1",
    company_id: UUID_COMPANY,
    cw_ticket_id: 1001,
    summary: "Printer doet het niet",
    status: "open",
    priority: "high",
    is_closed: false,
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
    closed_at: null,
    contact_name: "Jan Tester",
    board_name: "Service Board",
    type_name: "Hardware",
  },
  {
    id: "ticket-2",
    company_id: UUID_COMPANY,
    cw_ticket_id: 1002,
    summary: "E-mail configuratie",
    status: "in_progress",
    priority: "normal",
    is_closed: false,
    created_at: "2026-02-15T09:00:00Z",
    updated_at: "2026-03-02T14:00:00Z",
    closed_at: null,
    contact_name: "Piet Beheer",
    board_name: "Service Board",
    type_name: "Software",
  },
  {
    id: "ticket-3",
    company_id: UUID_COMPANY,
    cw_ticket_id: 1003,
    summary: "VPN instellen",
    status: "closed",
    priority: "low",
    is_closed: true,
    created_at: "2026-01-10T08:00:00Z",
    updated_at: "2026-01-12T16:00:00Z",
    closed_at: "2026-01-12T16:00:00Z",
    contact_name: "Jan Tester",
    board_name: "Service Board",
    type_name: "Network",
  },
];

describe("User Flow: login → dashboard → tickets → detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("Step 1: Authentication", () => {
    it("returns user profile after auth", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "profiles") return chain({ data: testProfile });
          if (table === "user_company_mapping") return chain({ data: { company_id: UUID_COMPANY } });
          return chain({ data: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getUserProfile } = await import("@/lib/repositories/company.repository");
      const profile = await getUserProfile();
      expect(profile).toBeTruthy();
      expect(profile?.full_name).toBe("Jan Tester");
    });

    it("returns null when not authenticated", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "No session" } }) },
        from: vi.fn().mockReturnValue(chain({ data: null, error: { message: "No auth" } })),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getUserProfile } = await import("@/lib/repositories/company.repository");
      const profile = await getUserProfile();
      expect(profile).toBeNull();
    });
  });

  describe("Step 2: Dashboard data loading", () => {
    it("loads all dashboard data in parallel", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "profiles") return chain({ data: testProfile });
          if (table === "user_company_mapping") return chain({ data: { company_id: UUID_COMPANY } });
          if (table === "companies") return chain({ data: testCompany });
          if (table === "hardware_assets") return chain({ data: [], count: 25 });
          if (table === "tickets") return chain({ data: testTickets, count: 10 });
          if (table === "agreements") return chain({ data: [], count: 5 });
          if (table === "licenses") return chain({ data: [], count: 15 });
          if (table === "notifications") return chain({ data: [] });
          if (table === "audit_log") return chain({ data: [] });
          return chain({ data: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getUserProfile, getUserCompanyId, getTickets } = await import("@/lib/repositories");

      const [profile, companyId, tickets] = await Promise.all([
        getUserProfile(),
        getUserCompanyId(),
        getTickets(),
      ]);

      expect(profile?.full_name).toBe("Jan Tester");
      expect(companyId).toBe(UUID_COMPANY);
      expect(tickets).toHaveLength(3);
    });
  });

  describe("Step 3: Tickets list", () => {
    it("returns tickets sorted and filtered", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_company_mapping") return chain({ data: { company_id: UUID_COMPANY } });
          if (table === "tickets") return chain({ data: testTickets });
          return chain({ data: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getTickets } = await import("@/lib/repositories/ticket.repository");
      const tickets = await getTickets();

      expect(tickets.length).toBeGreaterThan(0);
      const openTickets = tickets.filter(t => t.status === "open");
      expect(openTickets.length).toBe(1);
      const closedTickets = tickets.filter(t => t.is_closed);
      expect(closedTickets.length).toBe(1);
    });

    it("handles empty ticket list gracefully", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockReturnValue(chain({ data: [] })),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getTickets } = await import("@/lib/repositories/ticket.repository");
      const tickets = await getTickets();
      expect(tickets).toEqual([]);
    });
  });

  describe("Step 4: Ticket detail", () => {
    it("loads single ticket by ID", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_company_mapping") return chain({ data: { company_id: UUID_COMPANY } });
          if (table === "tickets") return chain({ data: testTickets[0] });
          return chain({ data: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getTicketById } = await import("@/lib/repositories/ticket.repository");
      const ticket = await getTicketById("ticket-1");
      expect(ticket).toBeTruthy();
      expect(ticket?.summary).toBe("Printer doet het niet");
      expect(ticket?.status).toBe("open");
      expect(ticket?.priority).toBe("high");
    });

    it("returns null for non-existent ticket", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockReturnValue(chain({ data: null })),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getTicketById } = await import("@/lib/repositories/ticket.repository");
      const ticket = await getTicketById("non-existent");
      expect(ticket).toBeNull();
    });
  });

  describe("Step 5: Data consistency across flow", () => {
    it("ticket from list matches ticket detail", async () => {
      const firstTicket = testTickets[0]!;
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_company_mapping") return chain({ data: { company_id: UUID_COMPANY } });
          if (table === "tickets") return chain({ data: firstTicket });
          return chain({ data: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getTicketById } = await import("@/lib/repositories/ticket.repository");
      const detail = await getTicketById(firstTicket.id);

      expect(detail?.id).toBe(firstTicket.id);
      expect(detail?.summary).toBe(firstTicket.summary);
      expect(detail?.status).toBe(firstTicket.status);
    });

    it("company context persists across pages", async () => {
      // getUserCompany() does a join: user_company_mapping → companies
      // The mock needs to return the nested structure the .single() call expects
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_company_mapping") {
            return chain({ data: { company_id: UUID_COMPANY, companies: testCompany } });
          }
          if (table === "companies") return chain({ data: testCompany });
          return chain({ data: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getUserCompany } = await import("@/lib/repositories/company.repository");
      const company = await getUserCompany();
      expect(company?.name).toBe("Test BV");
    });
  });
});
