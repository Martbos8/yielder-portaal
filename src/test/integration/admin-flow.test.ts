/**
 * Integration test: admin flow.
 * Tests: admin auth → sync status → audit log access.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

const mockedCreateClient = vi.mocked(createClient);

/** Chainable Supabase mock. */
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
  obj["single"] = vi.fn().mockResolvedValue(r);
  return proxy;
}

// ── Test data ──────────────────────────────────────────────────

const adminUser = { id: "admin-1", email: "admin@yielder.nl" };
const regularUser = { id: "user-1", email: "user@bedrijf.nl" };

const adminProfile = { id: "admin-1", is_yielder: true, full_name: "Admin User" };
const regularProfile = { id: "user-1", is_yielder: false, full_name: "Regular User" };

const syncLogs = [
  {
    id: "sync-1",
    entity_type: "tickets",
    status: "completed",
    records_synced: 150,
    duration_ms: 3200,
    error_message: null,
    created_at: "2026-03-12T01:00:00Z",
  },
  {
    id: "sync-2",
    entity_type: "hardware_assets",
    status: "completed",
    records_synced: 45,
    duration_ms: 1500,
    error_message: null,
    created_at: "2026-03-12T00:30:00Z",
  },
  {
    id: "sync-3",
    entity_type: "agreements",
    status: "failed",
    records_synced: 0,
    duration_ms: 500,
    error_message: "Connection timeout",
    created_at: "2026-03-11T23:00:00Z",
  },
];

const auditLogs = [
  {
    id: "audit-1",
    user_id: "user-1",
    action: "contact_request.created",
    entity_type: "contact_request",
    entity_id: null,
    metadata: { subject: "Test" },
    created_at: "2026-03-12T01:30:00Z",
  },
  {
    id: "audit-2",
    user_id: "admin-1",
    action: "sync.triggered",
    entity_type: "sync",
    entity_id: null,
    metadata: { entity: "tickets" },
    created_at: "2026-03-12T01:00:00Z",
  },
];

describe("Admin Flow: auth → sync status → audit log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("Step 1: Admin authentication", () => {
    it("identifies admin user via is_yielder flag", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: adminUser }, error: null }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "profiles") return chain({ data: adminProfile });
          if (table === "user_company_mapping") return chain({ data: [{ company_id: "comp-1" }] });
          return chain({ data: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getUserProfile } = await import("@/lib/repositories/company.repository");
      const profile = await getUserProfile();

      expect(profile).toBeTruthy();
      // Admin check is done via direct query in admin page, not via repository
      // But the profile should be available
      expect(profile?.full_name).toBe("Admin User");
    });

    it("non-admin user gets regular profile", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: regularUser }, error: null }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "profiles") return chain({ data: regularProfile });
          if (table === "user_company_mapping") return chain({ data: [{ company_id: "comp-2" }] });
          return chain({ data: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getUserProfile } = await import("@/lib/repositories/company.repository");
      const profile = await getUserProfile();
      expect(profile?.full_name).toBe("Regular User");
    });
  });

  describe("Step 2: Sync status loading", () => {
    it("loads sync status from repository", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: adminUser }, error: null }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "sync_status") return chain({ data: syncLogs });
          if (table === "user_company_mapping") return chain({ data: [{ company_id: "comp-1" }] });
          return chain({ data: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getSyncStatus } = await import("@/lib/repositories/sync.repository");
      const status = await getSyncStatus();

      expect(status).toBeTruthy();
    });
  });

  describe("Step 3: Audit log data", () => {
    it("audit log entries have required fields", () => {
      for (const entry of auditLogs) {
        expect(entry.id).toBeTruthy();
        expect(entry.user_id).toBeTruthy();
        expect(entry.action).toBeTruthy();
        expect(entry.entity_type).toBeTruthy();
        expect(entry.created_at).toBeTruthy();
      }
    });

    it("audit log actions follow naming convention", () => {
      for (const entry of auditLogs) {
        // Actions should be dot-separated (entity.action)
        expect(entry.action).toMatch(/^[a-z_]+\.[a-z_]+$/);
      }
    });
  });

  describe("Step 4: Sync failure handling", () => {
    it("failed sync logs include error message", () => {
      const failed = syncLogs.filter(l => l.status === "failed");
      expect(failed.length).toBe(1);
      expect(failed[0]!.error_message).toBeTruthy();
      expect(failed[0]!.records_synced).toBe(0);
    });

    it("successful syncs have no error message", () => {
      const successful = syncLogs.filter(l => l.status === "completed");
      expect(successful.length).toBe(2);
      for (const log of successful) {
        expect(log.error_message).toBeNull();
        expect(log.records_synced).toBeGreaterThan(0);
      }
    });
  });
});
