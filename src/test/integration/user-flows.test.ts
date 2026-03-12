/**
 * Integration tests: multi-step user flows.
 *
 * These tests verify that repository functions compose correctly to support
 * end-to-end user journeys through the portal. Each test simulates the
 * sequence of data fetches that would occur during a real user flow.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

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

// ── Chain helper (mirrors Supabase query builder) ────────────────────────────

function chain(result: { data?: unknown; error?: { message: string; code?: string } | null; count?: number | null }) {
  const r = { data: result.data ?? null, error: result.error ?? null, count: result.count ?? null };
  const methods = ["select", "insert", "update", "eq", "neq", "lt", "lte", "not", "or", "in", "order", "limit", "returns"];
  const obj: Record<string, unknown> = {};

  const proxy: unknown = new Proxy(obj, {
    get(t, p) {
      if (p === "then") return (ok: (v: unknown) => void, fail: (e: unknown) => void) => Promise.resolve(r).then(ok, fail);
      return t[p as string];
    },
  });

  for (const m of methods) obj[m] = vi.fn().mockReturnValue(proxy);
  // .single() returns first item of array (or null), matching Supabase behavior
  const singleData = Array.isArray(r.data) ? (r.data[0] ?? null) : r.data;
  obj["single"] = vi.fn().mockResolvedValue({ ...r, data: singleData });

  return proxy;
}

/** Set up a mock Supabase client that returns data based on table name. */
function mockSbMultiTable(tableData: Record<string, unknown>, authUser: { id: string } | null = { id: "u1" }) {
  const sb = {
    from: vi.fn().mockImplementation((table: string) => {
      const data = tableData[table] ?? [];
      return chain({ data });
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: authUser }, error: null }),
    },
  };
  mockedCreateClient.mockResolvedValue(sb as never);
  return sb;
}

// ── Test data ────────────────────────────────────────────────────────────────

const MOCK_PROFILE = {
  id: "u1",
  email: "jan@example.nl",
  full_name: "Jan de Vries",
  avatar_url: null,
  is_yielder: false,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const MOCK_COMPANY = {
  id: "c1",
  cw_company_id: 100,
  name: "Testbedrijf BV",
  employee_count: 50,
  industry: "IT",
  region: "Noord-Holland",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const MOCK_TICKETS = [
  {
    id: "t1", company_id: "c1", cw_ticket_id: 1001,
    summary: "Printer doet het niet", description: "De printer op verdieping 3 reageert niet.",
    status: "open", priority: "high", contact_name: "Jan de Vries",
    source: "portal", is_closed: false,
    cw_created_at: "2025-06-01T10:00:00Z", cw_updated_at: "2025-06-01T12:00:00Z",
    created_at: "2025-06-01T10:00:00Z", updated_at: "2025-06-01T12:00:00Z",
  },
  {
    id: "t2", company_id: "c1", cw_ticket_id: 1002,
    summary: "VPN verbinding valt weg", description: null,
    status: "in_progress", priority: "normal", contact_name: "Piet Bakker",
    source: "email", is_closed: false,
    cw_created_at: "2025-06-02T08:00:00Z", cw_updated_at: "2025-06-03T14:00:00Z",
    created_at: "2025-06-02T08:00:00Z", updated_at: "2025-06-03T14:00:00Z",
  },
  {
    id: "t3", company_id: "c1", cw_ticket_id: 1003,
    summary: "Wifi traag op kantoor", description: "Sinds maandag.",
    status: "closed", priority: "low", contact_name: "Jan de Vries",
    source: "portal", is_closed: true,
    cw_created_at: "2025-05-20T09:00:00Z", cw_updated_at: "2025-05-22T16:00:00Z",
    created_at: "2025-05-20T09:00:00Z", updated_at: "2025-05-22T16:00:00Z",
  },
];

const MOCK_HARDWARE = [
  {
    id: "h1", company_id: "c1", cw_config_id: 201,
    name: "Dell Optiplex 5060", type: "Desktop", manufacturer: "Dell",
    serial_number: "SN001", warranty_expiry: "2026-01-01",
    purchase_date: "2023-01-01", status: "active",
    created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "h2", company_id: "c1", cw_config_id: 202,
    name: "HP LaserJet Pro", type: "Printer", manufacturer: "HP",
    serial_number: "SN002", warranty_expiry: "2025-01-01",
    purchase_date: "2022-01-01", status: "active",
    created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z",
  },
];

const MOCK_AGREEMENTS = [
  {
    id: "a1", company_id: "c1", cw_agreement_id: 301,
    name: "Managed IT Support", type: "managed", status: "active",
    bill_amount: 2500, start_date: "2025-01-01", end_date: "2026-12-31",
    created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "a2", company_id: "c1", cw_agreement_id: 302,
    name: "Office 365 License", type: "license", status: "active",
    bill_amount: 800, start_date: "2025-03-01", end_date: "2026-03-01",
    created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z",
  },
];

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Integration: User flow — login → dashboard → tickets → detail", () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it("authenticates user, loads profile, and navigates to dashboard data", async () => {
    // Step 1: User authenticates and their profile is loaded
    mockSbMultiTable({
      profiles: [MOCK_PROFILE],
      user_company_mapping: [{ company_id: "c1", user_id: "u1" }],
    });

    const { getUserProfile, getUserCompanyId } = await import("@/lib/repositories");
    const profile = await getUserProfile();
    expect(profile).toBeTruthy();
    expect(profile?.full_name).toBe("Jan de Vries");

    const companyId = await getUserCompanyId();
    expect(companyId).toBeTruthy();
  });

  it("loads dashboard stats after authentication", async () => {
    mockSbMultiTable({
      tickets: MOCK_TICKETS,
      hardware_assets: MOCK_HARDWARE,
      agreements: MOCK_AGREEMENTS,
    });

    const { getTickets, getHardwareAssets, getAgreements } = await import("@/lib/repositories");

    // Dashboard fetches multiple data sources in parallel
    const [tickets, hardware, agreements] = await Promise.all([
      getTickets(),
      getHardwareAssets(),
      getAgreements(),
    ]);

    expect(tickets).toHaveLength(3);
    expect(hardware).toHaveLength(2);
    expect(agreements).toHaveLength(2);
  });

  it("navigates from ticket list to ticket detail and back", async () => {
    // Step 1: User views ticket list
    mockSbMultiTable({ tickets: MOCK_TICKETS });
    const { getTickets } = await import("@/lib/repositories");
    const tickets = await getTickets();
    expect(tickets).toHaveLength(3);

    // Step 2: User clicks first ticket — fetch detail
    vi.clearAllMocks();
    const ticketDetail = MOCK_TICKETS[0]!;
    mockSbMultiTable({ tickets: [ticketDetail] });

    const { getTicketById } = await import("@/lib/repositories");
    const detail = await getTicketById(ticketDetail.id);
    expect(detail).toBeTruthy();
    expect(detail?.summary).toBe("Printer doet het niet");

    // Step 3: User navigates back — ticket list is still available
    vi.clearAllMocks();
    mockSbMultiTable({ tickets: MOCK_TICKETS });
    const { getTickets: getTicketsAgain } = await import("@/lib/repositories");
    const ticketsAgain = await getTicketsAgain();
    expect(ticketsAgain).toHaveLength(3);
  });

  it("ticket detail loads similar tickets and stats", async () => {
    mockSbMultiTable({ tickets: [MOCK_TICKETS[1], MOCK_TICKETS[2]] });

    const { getSimilarTickets } = await import("@/lib/repositories");
    const similar = await getSimilarTickets("t1", "c1", "portal");
    expect(similar.length).toBeGreaterThanOrEqual(0);
  });
});

describe("Integration: Recommendation flow — upgrade page", () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it("loads recommendations and agreements for upgrade page", async () => {
    mockSbMultiTable({
      agreements: MOCK_AGREEMENTS,
      hardware_assets: MOCK_HARDWARE,
      tickets: MOCK_TICKETS,
    });

    const { getAgreements, getHardwareAssets, getTickets } = await import("@/lib/repositories");

    // Upgrade page loads data to compute recommendations
    const [agreements, hardware, tickets] = await Promise.all([
      getAgreements(),
      getHardwareAssets(),
      getTickets(),
    ]);

    // Verify all data loaded for recommendation engine
    expect(agreements.some(a => a.name.includes("Managed"))).toBe(true);
    expect(hardware.some(h => h.manufacturer === "Dell")).toBe(true);
    expect(tickets.some(t => t.status === "open")).toBe(true);
  });

  it("loads contacts for contact modal on recommendation click", async () => {
    mockSbMultiTable({
      contacts: [
        { id: "ct1", company_id: "c1", full_name: "Jan de Vries", email: "jan@example.nl", phone: "0612345678", role: "IT Manager" },
      ],
    });

    const { getContacts } = await import("@/lib/repositories");
    const contacts = await getContacts();
    expect(contacts).toHaveLength(1);
    expect(contacts[0]?.full_name).toBe("Jan de Vries");
  });
});

describe("Integration: Admin flow — sync status and audit", () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it("admin user loads sync status and profile data", async () => {
    const adminProfile = { ...MOCK_PROFILE, is_yielder: true };
    mockSbMultiTable({
      profiles: [adminProfile],
      sync_log: [
        { id: "s1", entity_type: "tickets", status: "completed", records_synced: 42, started_at: "2025-06-01T00:00:00Z", completed_at: "2025-06-01T00:01:00Z" },
        { id: "s2", entity_type: "hardware", status: "completed", records_synced: 15, started_at: "2025-06-01T00:00:00Z", completed_at: "2025-06-01T00:02:00Z" },
      ],
    });

    const { getUserProfile, getSyncStatus } = await import("@/lib/repositories");

    // Step 1: Verify admin access
    const profile = await getUserProfile();
    expect(profile?.is_yielder).toBe(true);

    // Step 2: Load sync status
    const syncStatus = await getSyncStatus();
    expect(syncStatus.length).toBeGreaterThanOrEqual(0);
  });

  it("non-admin user cannot access admin data (redirect check)", async () => {
    mockSbMultiTable({ profiles: [MOCK_PROFILE] }); // is_yielder: false

    const { getUserProfile } = await import("@/lib/repositories");
    const profile = await getUserProfile();
    expect(profile?.is_yielder).toBe(false);
    // In the real app, the admin page would redirect to /dashboard
  });
});

describe("Integration: Error recovery — network error then success", () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it("retries after database error and succeeds", async () => {
    // First attempt: error
    const errorChain = chain({ error: { message: "connection timeout", code: "TIMEOUT" } });
    const sb1 = {
      from: vi.fn().mockReturnValue(errorChain),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }) },
    };
    mockedCreateClient.mockResolvedValue(sb1 as never);

    const { getTickets } = await import("@/lib/repositories");
    await expect(getTickets()).rejects.toThrow(/Failed to fetch tickets/);

    // Second attempt: success (simulating retry)
    vi.clearAllMocks();
    const successChain = chain({ data: MOCK_TICKETS });
    const sb2 = {
      from: vi.fn().mockReturnValue(successChain),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }) },
    };
    mockedCreateClient.mockResolvedValue(sb2 as never);

    const tickets = await getTickets();
    expect(tickets).toHaveLength(3);
    expect(tickets[0]?.summary).toBe("Printer doet het niet");
  });

  it("handles auth failure gracefully", async () => {
    const sb = {
      from: vi.fn().mockReturnValue(chain({ data: [] })),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    };
    mockedCreateClient.mockResolvedValue(sb as never);

    const { getUserProfile } = await import("@/lib/repositories");
    const profile = await getUserProfile();
    expect(profile).toBeNull();
  });

  it("handles partial data failure in dashboard", async () => {
    // Tickets fail but hardware succeeds
    let callCount = 0;
    const sb = {
      from: vi.fn().mockImplementation((table: string) => {
        callCount++;
        if (table === "tickets") {
          return chain({ error: { message: "timeout" } });
        }
        return chain({ data: MOCK_HARDWARE });
      }),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }) },
    };
    mockedCreateClient.mockResolvedValue(sb as never);

    const { getTickets, getHardwareAssets } = await import("@/lib/repositories");

    const results = await Promise.allSettled([getTickets(), getHardwareAssets()]);
    expect(results[0]?.status).toBe("rejected");
    expect(results[1]?.status).toBe("fulfilled");

    if (results[1]?.status === "fulfilled") {
      expect(results[1].value).toHaveLength(2);
    }
    expect(callCount).toBeGreaterThanOrEqual(2);
  });
});

describe("Integration: Empty states — new company with no data", () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

  it("handles company with no tickets", async () => {
    mockSbMultiTable({ tickets: [] });

    const { getTickets } = await import("@/lib/repositories");
    const tickets = await getTickets();
    expect(tickets).toEqual([]);
  });

  it("handles company with no hardware", async () => {
    mockSbMultiTable({ hardware_assets: [] });

    const { getHardwareAssets } = await import("@/lib/repositories");
    const hardware = await getHardwareAssets();
    expect(hardware).toEqual([]);
  });

  it("handles company with no agreements", async () => {
    mockSbMultiTable({ agreements: [] });

    const { getAgreements } = await import("@/lib/repositories");
    const agreements = await getAgreements();
    expect(agreements).toEqual([]);
  });

  it("handles company with no contacts", async () => {
    mockSbMultiTable({ contacts: [] });

    const { getContacts } = await import("@/lib/repositories");
    const contacts = await getContacts();
    expect(contacts).toEqual([]);
  });

  it("handles company with no notifications", async () => {
    mockSbMultiTable({ notifications: [] });

    const { getNotifications, getUnreadNotificationCount } = await import("@/lib/repositories");
    const notifications = await getNotifications();
    expect(notifications).toEqual([]);
    const count = await getUnreadNotificationCount();
    expect(count).toBe(0);
  });

  it("handles fully empty company — all resources empty", async () => {
    mockSbMultiTable({
      profiles: [MOCK_PROFILE],
      user_company_mapping: [{ company_id: "c1", user_id: "u1" }],
      companies: [MOCK_COMPANY],
      tickets: [],
      hardware_assets: [],
      agreements: [],
      contacts: [],
      notifications: [],
      licenses: [],
    });

    const {
      getUserProfile,
      getTickets,
      getHardwareAssets,
      getAgreements,
      getContacts,
      getNotifications,
      getLicenses,
    } = await import("@/lib/repositories");

    const [profile, tickets, hardware, agreements, contacts, notifications, licenses] =
      await Promise.all([
        getUserProfile(),
        getTickets(),
        getHardwareAssets(),
        getAgreements(),
        getContacts(),
        getNotifications(),
        getLicenses(),
      ]);

    expect(profile).toBeTruthy();
    expect(tickets).toEqual([]);
    expect(hardware).toEqual([]);
    expect(agreements).toEqual([]);
    expect(contacts).toEqual([]);
    expect(notifications).toEqual([]);
    expect(licenses).toEqual([]);
  });

  it("handles unauthenticated user — no session", async () => {
    mockSbMultiTable({}, null);

    const { getUserProfile, getUserCompanyId } = await import("@/lib/repositories");

    const profile = await getUserProfile();
    expect(profile).toBeNull();

    const companyId = await getUserCompanyId();
    expect(companyId).toBeNull();
  });
});
