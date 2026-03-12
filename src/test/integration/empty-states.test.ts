/**
 * Integration test: empty states.
 * Tests: new company with no data — every repository returns empty gracefully.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

const mockedCreateClient = vi.mocked(createClient);

/** Chainable Supabase mock that always returns empty data. */
function emptyChain() {
  const r = { data: [], error: null, count: 0 };
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
  obj["single"] = vi.fn().mockResolvedValue({ data: null, error: null, count: null });
  return proxy;
}

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
  // .single() extracts first array element, matching real Supabase
  const sd = Array.isArray(r.data) ? (r.data[0] ?? null) : r.data;
  obj["single"] = vi.fn().mockResolvedValue({ ...r, data: sd });
  return proxy;
}

const UUID_USER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const UUID_COMPANY = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const newUser = { id: UUID_USER, email: "nieuw@bedrijf.nl" };
const newProfile = {
  id: UUID_USER,
  full_name: "Nieuwe Gebruiker",
  email: "nieuw@bedrijf.nl",
  is_yielder: false,
  avatar_url: null,
  created_at: "2026-03-12",
  updated_at: "2026-03-12",
};

describe("Empty States: new company with no data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  function createEmptySupabase() {
    return {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: newUser }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "profiles") return chain({ data: newProfile });
        if (table === "user_company_mapping") return chain({ data: { company_id: UUID_COMPANY } });
        if (table === "companies") return chain({ data: { id: UUID_COMPANY, name: "Leeg BV", size: "small" } });
        return emptyChain();
      }),
    };
  }

  describe("Empty ticket list", () => {
    it("returns empty array, not null or error", async () => {
      mockedCreateClient.mockResolvedValue(createEmptySupabase() as never);
      const { getTickets } = await import("@/lib/repositories/ticket.repository");
      const tickets = await getTickets();
      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets).toHaveLength(0);
    });

    it("open ticket count is 0", async () => {
      mockedCreateClient.mockResolvedValue(createEmptySupabase() as never);
      const { getOpenTicketCount } = await import("@/lib/repositories/ticket.repository");
      const count = await getOpenTicketCount();
      expect(count).toBe(0);
    });
  });

  describe("Empty hardware list", () => {
    it("returns empty array", async () => {
      mockedCreateClient.mockResolvedValue(createEmptySupabase() as never);
      const { getHardwareAssets } = await import("@/lib/repositories/hardware.repository");
      const assets = await getHardwareAssets();
      expect(Array.isArray(assets)).toBe(true);
      expect(assets).toHaveLength(0);
    });
  });

  describe("Empty agreements list", () => {
    it("returns empty array", async () => {
      mockedCreateClient.mockResolvedValue(createEmptySupabase() as never);
      const { getAgreements } = await import("@/lib/repositories/agreement.repository");
      const agreements = await getAgreements();
      expect(Array.isArray(agreements)).toBe(true);
      expect(agreements).toHaveLength(0);
    });
  });

  describe("Empty notifications", () => {
    it("returns empty array", async () => {
      mockedCreateClient.mockResolvedValue(createEmptySupabase() as never);
      const { getNotifications } = await import("@/lib/repositories/notification.repository");
      const notifications = await getNotifications();
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications).toHaveLength(0);
    });

    it("unread count is 0", async () => {
      mockedCreateClient.mockResolvedValue(createEmptySupabase() as never);
      const { getUnreadNotificationCount } = await import("@/lib/repositories/notification.repository");
      const count = await getUnreadNotificationCount();
      expect(count).toBe(0);
    });
  });

  describe("Empty licenses", () => {
    it("returns empty array", async () => {
      mockedCreateClient.mockResolvedValue(createEmptySupabase() as never);
      const { getLicenses } = await import("@/lib/repositories/license.repository");
      const licenses = await getLicenses();
      expect(Array.isArray(licenses)).toBe(true);
      expect(licenses).toHaveLength(0);
    });
  });

  describe("Health scores with no data", () => {
    it("calculates default scores for empty inputs", async () => {
      const { calculateHealthScores, getOverallScore } = await import("@/lib/health-scores");
      const scores = calculateHealthScores([], []);
      const overall = getOverallScore(scores);

      expect(overall).toBeGreaterThanOrEqual(0);
      expect(overall).toBeLessThanOrEqual(100);
    });
  });

  describe("Recommendation engine with no gaps", () => {
    it("returns empty recommendations for no gaps and no patterns", async () => {
      const { computeRecommendations } = await import("@/lib/engine/recommendation");
      const recommendations = computeRecommendations([], [], new Map());
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations).toHaveLength(0);
    });
  });

  describe("Contract utilities with empty data", () => {
    it("counts 0 expiring contracts", async () => {
      const { countExpiringSoon } = await import("@/lib/contract-utils");
      expect(countExpiringSoon([])).toBe(0);
    });
  });

  describe("Performance stats with no tickets", () => {
    it("calculates SLA metrics with empty array", async () => {
      const { calculateSLAMetrics } = await import("@/lib/performance-stats");
      const metrics = calculateSLAMetrics([]);
      expect(metrics).toBeTruthy();
    });
  });

  describe("User profile always exists", () => {
    it("authenticated user has profile", async () => {
      mockedCreateClient.mockResolvedValue(createEmptySupabase() as never);
      const { getUserProfile } = await import("@/lib/repositories/company.repository");
      const profile = await getUserProfile();
      expect(profile).toBeTruthy();
      expect(profile?.full_name).toBe("Nieuwe Gebruiker");
    });

    it("company ID exists even with no other data", async () => {
      mockedCreateClient.mockResolvedValue(createEmptySupabase() as never);
      const { getUserCompanyId } = await import("@/lib/repositories/company.repository");
      const companyId = await getUserCompanyId();
      expect(companyId).toBe(UUID_COMPANY);
    });
  });
});
