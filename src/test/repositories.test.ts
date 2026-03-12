import { describe, it, expect, vi, beforeEach } from "vitest";
import { DatabaseError } from "@/lib/errors";

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

function chain(result: { data?: unknown; error?: { message: string; code?: string } | null; count?: number | null }) {
  const r = { data: result.data ?? null, error: result.error ?? null, count: result.count ?? null };
  const methods = ["select","insert","update","eq","neq","lt","lte","not","or","in","order","limit","returns"];
  const obj: Record<string, unknown> = {};

  // Create proxy FIRST so chain methods can return it
  const proxy: unknown = new Proxy(obj, {
    get(t, p) {
      if (p === "then") return (ok: (v: unknown) => void, fail: (e: unknown) => void) => Promise.resolve(r).then(ok, fail);
      return t[p as string];
    },
  });

  // Chain methods return the proxy (not obj) to keep then-handler reachable
  for (const m of methods) obj[m] = vi.fn().mockReturnValue(proxy);
  obj["single"] = vi.fn().mockResolvedValue(r);

  return proxy;
}

function mockSb(opts: {
  data?: unknown; error?: { message: string; code?: string } | null;
  count?: number | null; authUser?: { id: string } | null;
  singleResult?: { data: unknown; error: { message: string; code?: string } | null };
} = {}) {
  const queryChain = chain({ data: opts.data ?? [], error: opts.error, count: opts.count });
  if (opts.singleResult) {
    (queryChain as Record<string, unknown>)["single"] = vi.fn().mockResolvedValue(opts.singleResult);
  }
  const sb = {
    from: vi.fn().mockReturnValue(queryChain),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: opts.authUser ?? null }, error: null }) },
  };
  mockedCreateClient.mockResolvedValue(sb as never);
  return sb;
}

describe("Ticket Repository", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getTickets returns tickets", async () => {
    mockSb({ data: [{ id: "t1" }, { id: "t2" }] });
    const { getTickets } = await import("@/lib/repositories/ticket.repository");
    expect(await getTickets()).toEqual([{ id: "t1" }, { id: "t2" }]);
  });

  it("getTickets returns [] on null data", async () => {
    mockSb({ data: null });
    const { getTickets } = await import("@/lib/repositories/ticket.repository");
    expect(await getTickets()).toEqual([]);
  });

  it("getTickets throws DatabaseError on error", async () => {
    mockSb({ error: { message: "conn fail" } });
    const { getTickets } = await import("@/lib/repositories/ticket.repository");
    await expect(getTickets()).rejects.toThrow(DatabaseError);
  });

  it("getTicketById returns ticket", async () => {
    mockSb({ singleResult: { data: { id: "t1" }, error: null } });
    const { getTicketById } = await import("@/lib/repositories/ticket.repository");
    expect(await getTicketById("t1")).toEqual({ id: "t1" });
  });

  it("getTicketById returns null for PGRST116", async () => {
    mockSb({ singleResult: { data: null, error: { code: "PGRST116", message: "not found" } } });
    const { getTicketById } = await import("@/lib/repositories/ticket.repository");
    expect(await getTicketById("x")).toBeNull();
  });

  it("getTicketById throws on other errors", async () => {
    mockSb({ singleResult: { data: null, error: { code: "42P01", message: "missing" } } });
    const { getTicketById } = await import("@/lib/repositories/ticket.repository");
    await expect(getTicketById("x")).rejects.toThrow(DatabaseError);
  });

  it("getOpenTicketCount returns count", async () => {
    mockSb({ count: 7 });
    const { getOpenTicketCount } = await import("@/lib/repositories/ticket.repository");
    expect(await getOpenTicketCount()).toBe(7);
  });

  it("getRecentTickets returns tickets", async () => {
    mockSb({ data: [{ id: "t1" }] });
    const { getRecentTickets } = await import("@/lib/repositories/ticket.repository");
    expect(await getRecentTickets(3)).toEqual([{ id: "t1" }]);
  });

  it("getTicketStats computes averages", async () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    mockSb({ data: [
      { is_closed: false, cw_created_at: twoHoursAgo.toISOString(), cw_updated_at: now.toISOString() },
      { is_closed: true, cw_created_at: twoHoursAgo.toISOString(), cw_updated_at: now.toISOString() },
      { is_closed: false, cw_created_at: null, cw_updated_at: null },
    ] });
    const { getTicketStats } = await import("@/lib/repositories/ticket.repository");
    const s = await getTicketStats();
    expect(s.totalOpen).toBe(2);
    expect(s.totalClosed).toBe(1);
    expect(s.avgResponseHours).toBeCloseTo(2, 0);
  });

  it("getTicketStats returns nulls for empty data", async () => {
    mockSb({ data: [] });
    const { getTicketStats } = await import("@/lib/repositories/ticket.repository");
    const s = await getTicketStats();
    expect(s.avgResponseHours).toBeNull();
    expect(s.avgResolutionDays).toBeNull();
  });

  it("getSimilarTickets returns tickets", async () => {
    mockSb({ data: [{ id: "t2" }] });
    const { getSimilarTickets } = await import("@/lib/repositories/ticket.repository");
    expect(await getSimilarTickets("t1", "c1", "email")).toEqual([{ id: "t2" }]);
  });
});

describe("Hardware Repository", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getHardwareAssets returns assets", async () => {
    mockSb({ data: [{ id: "h1", name: "Laptop" }] });
    const { getHardwareAssets } = await import("@/lib/repositories/hardware.repository");
    expect(await getHardwareAssets()).toEqual([{ id: "h1", name: "Laptop" }]);
  });

  it("getHardwareAssets throws on error", async () => {
    mockSb({ error: { message: "fail" } });
    const { getHardwareAssets } = await import("@/lib/repositories/hardware.repository");
    await expect(getHardwareAssets()).rejects.toThrow(DatabaseError);
  });

  it("getExpiredWarrantyHardware returns assets", async () => {
    mockSb({ data: [{ id: "h1" }] });
    const { getExpiredWarrantyHardware } = await import("@/lib/repositories/hardware.repository");
    expect(await getExpiredWarrantyHardware()).toEqual([{ id: "h1" }]);
  });
});

describe("Agreement Repository", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getAgreements returns agreements", async () => {
    mockSb({ data: [{ id: "a1", name: "Plan" }] });
    const { getAgreements } = await import("@/lib/repositories/agreement.repository");
    expect(await getAgreements()).toEqual([{ id: "a1", name: "Plan" }]);
  });

  it("getAgreements throws on error", async () => {
    mockSb({ error: { message: "fail" } });
    const { getAgreements } = await import("@/lib/repositories/agreement.repository");
    await expect(getAgreements()).rejects.toThrow(DatabaseError);
  });

  it("getExpiringAgreements returns agreements", async () => {
    mockSb({ data: [{ id: "a1" }] });
    const { getExpiringAgreements } = await import("@/lib/repositories/agreement.repository");
    expect(await getExpiringAgreements(30)).toEqual([{ id: "a1" }]);
  });
});

describe("Notification Repository", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getNotifications returns notifications", async () => {
    mockSb({ data: [{ id: "n1", title: "Test" }] });
    const { getNotifications } = await import("@/lib/repositories/notification.repository");
    expect(await getNotifications()).toEqual([{ id: "n1", title: "Test" }]);
  });

  it("getNotifications returns [] on null data", async () => {
    mockSb({ data: null });
    const { getNotifications } = await import("@/lib/repositories/notification.repository");
    expect(await getNotifications()).toEqual([]);
  });

  it("getUnreadNotificationCount returns count", async () => {
    mockSb({ count: 5 });
    const { getUnreadNotificationCount } = await import("@/lib/repositories/notification.repository");
    expect(await getUnreadNotificationCount()).toBe(5);
  });
});

describe("License Repository", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getLicenses returns licenses", async () => {
    mockSb({ data: [{ id: "l1", vendor: "Microsoft" }] });
    const { getLicenses } = await import("@/lib/repositories/license.repository");
    expect(await getLicenses()).toEqual([{ id: "l1", vendor: "Microsoft" }]);
  });

  it("getLicenses throws on error", async () => {
    mockSb({ error: { message: "fail" } });
    const { getLicenses } = await import("@/lib/repositories/license.repository");
    await expect(getLicenses()).rejects.toThrow(DatabaseError);
  });
});

describe("Product Repository", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getActiveProducts returns products", async () => {
    mockSb({ data: [{ id: "p1", name: "Firewall" }] });
    const { getActiveProducts } = await import("@/lib/repositories/product.repository");
    expect(await getActiveProducts()).toEqual([{ id: "p1", name: "Firewall" }]);
  });

  it("getProductCategories returns categories", async () => {
    mockSb({ data: [{ id: "c1", name: "Security" }] });
    const { getProductCategories } = await import("@/lib/repositories/product.repository");
    expect(await getProductCategories()).toEqual([{ id: "c1", name: "Security" }]);
  });

  it("getProductDependencies returns dependencies", async () => {
    mockSb({ data: [{ id: "d1" }] });
    const { getProductDependencies } = await import("@/lib/repositories/product.repository");
    expect(await getProductDependencies()).toEqual([{ id: "d1" }]);
  });

  it("getClientProducts returns client products", async () => {
    const sb = mockSb({ data: [{ id: "cp1" }] });
    const { getClientProducts } = await import("@/lib/repositories/product.repository");
    expect(await getClientProducts("comp-1")).toEqual([{ id: "cp1" }]);
    expect(sb.from).toHaveBeenCalledWith("client_products");
  });
});

describe("Company Repository", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getUserProfile returns null when not authenticated", async () => {
    mockSb({ authUser: null });
    const { getUserProfile } = await import("@/lib/repositories/company.repository");
    expect(await getUserProfile()).toBeNull();
  });

  it("getUserProfile returns profile", async () => {
    mockSb({ authUser: { id: "u1" }, singleResult: { data: { id: "u1", email: "a@b.com" }, error: null } });
    const { getUserProfile } = await import("@/lib/repositories/company.repository");
    expect(await getUserProfile()).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("getUserProfile returns null on PGRST116", async () => {
    mockSb({ authUser: { id: "u1" }, singleResult: { data: null, error: { code: "PGRST116", message: "nf" } } });
    const { getUserProfile } = await import("@/lib/repositories/company.repository");
    expect(await getUserProfile()).toBeNull();
  });

  it("getUserCompanyId returns null when not authenticated", async () => {
    mockSb({ authUser: null });
    const { getUserCompanyId } = await import("@/lib/repositories/company.repository");
    expect(await getUserCompanyId()).toBeNull();
  });

  it("getUserCompanyId returns company_id", async () => {
    mockSb({ authUser: { id: "u1" }, singleResult: { data: { company_id: "c1" }, error: null } });
    const { getUserCompanyId } = await import("@/lib/repositories/company.repository");
    expect(await getUserCompanyId()).toBe("c1");
  });

  it("getContacts returns contacts", async () => {
    mockSb({ data: [{ id: "c1", full_name: "John" }] });
    const { getContacts } = await import("@/lib/repositories/company.repository");
    expect(await getContacts()).toEqual([{ id: "c1", full_name: "John" }]);
  });

  it("getDashboardStats aggregates correctly", async () => {
    const sb = {
      from: vi.fn()
        .mockReturnValueOnce(chain({ count: 3 }))
        .mockReturnValueOnce(chain({ count: 10 }))
        .mockReturnValueOnce(chain({ count: 2 }))
        .mockReturnValueOnce(chain({ data: [{ bill_amount: 500 }, { bill_amount: 300 }] })),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    };
    mockedCreateClient.mockResolvedValue(sb as never);
    const { getDashboardStats } = await import("@/lib/repositories/company.repository");
    const s = await getDashboardStats();
    expect(s.openTickets).toBe(3);
    expect(s.hardwareCount).toBe(10);
    expect(s.activeContracts).toBe(2);
    expect(s.monthlyAmount).toBe(800);
  });
});
