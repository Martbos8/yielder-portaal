/**
 * Integration test: error recovery.
 * Tests: network error → retry → success, and various error states.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AuthError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  DatabaseError,
  isAppError,
  getErrorMessage,
} from "@/lib/errors";

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

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({
    allowed: true,
    remaining: 10,
    resetInMs: 60000,
    warning: false,
    currentCount: 0,
  }),
  RATE_LIMITS: {
    contactRequest: { maxRequests: 5, windowMs: 60000 },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

import { createClient } from "@/lib/supabase/server";

const mockedCreateClient = vi.mocked(createClient);

/** Chainable Supabase mock. */
function chain(result: { data?: unknown; error?: unknown }) {
  const r = { data: result.data ?? null, error: result.error ?? null, count: null };
  const methods = ["select", "insert", "update", "eq", "neq", "not", "or", "in", "order", "limit", "returns", "is"];
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

const testUser = { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", email: "error@test.nl" };

describe("Error Recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("Error classification", () => {
    it("AuthError is operational with 401", () => {
      const err = new AuthError("Not authenticated");
      expect(err.statusCode).toBe(401);
      expect(err.isOperational).toBe(true);
      expect(isAppError(err)).toBe(true);
    });

    it("NotFoundError is operational with 404", () => {
      const err = new NotFoundError("Ticket niet gevonden");
      expect(err.statusCode).toBe(404);
      expect(err.isOperational).toBe(true);
    });

    it("ValidationError is operational with 400", () => {
      const err = new ValidationError("Ongeldige invoer");
      expect(err.statusCode).toBe(400);
      expect(err.isOperational).toBe(true);
    });

    it("RateLimitError is operational with 429", () => {
      const err = new RateLimitError(30000);
      expect(err.statusCode).toBe(429);
      expect(err.isOperational).toBe(true);
    });

    it("DatabaseError is non-operational with 500", () => {
      const err = new DatabaseError("Connection failed");
      expect(err.statusCode).toBe(500);
      expect(err.isOperational).toBe(false);
    });

    it("generic Error is not an AppError", () => {
      const err = new Error("Something broke");
      expect(isAppError(err)).toBe(false);
    });
  });

  describe("Error message extraction", () => {
    it("extracts message from operational AppError", () => {
      const err = new AuthError("Sessie verlopen");
      expect(getErrorMessage(err)).toBe("Sessie verlopen");
    });

    it("returns fallback for generic Error in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      const err = new Error("Unexpected failure");
      expect(getErrorMessage(err)).toBe("Er is een onverwachte fout opgetreden");
      vi.unstubAllEnvs();
    });

    it("returns fallback for unknown error types", () => {
      expect(getErrorMessage(null)).toBe("Er is een onverwachte fout opgetreden");
      expect(getErrorMessage(undefined)).toBe("Er is een onverwachte fout opgetreden");
      expect(getErrorMessage(42)).toBe("Er is een onverwachte fout opgetreden");
    });

    it("non-operational AppError gets fallback in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      const err = new DatabaseError("Connection refused");
      expect(getErrorMessage(err)).toBe("Er is een onverwachte fout opgetreden");
      vi.unstubAllEnvs();
    });
  });

  describe("Error serialization", () => {
    it("AppError serializes to JSON", () => {
      const err = new ValidationError("Veld is verplicht");
      const json = err.toJSON();
      expect(json.error).toBe("Veld is verplicht");
      expect(json.code).toBe("VALIDATION_ERROR");
      expect(json.statusCode).toBe(400);
    });
  });

  describe("Network error → retry → success pattern", () => {
    it("first call fails, retry succeeds", async () => {
      // First attempt: Supabase returns error
      const errorSb = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockReturnValue(chain({ error: { message: "Network error" } })),
      };
      mockedCreateClient.mockResolvedValue(errorSb as never);

      const { getTickets } = await import("@/lib/repositories/ticket.repository");

      // First call throws DatabaseError
      await expect(getTickets()).rejects.toThrow(/Failed to fetch tickets/);

      // Second attempt: Supabase returns success
      vi.clearAllMocks();
      const successSb = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockReturnValue(chain({ data: [{ id: "ticket-1", summary: "Test" }] })),
      };
      mockedCreateClient.mockResolvedValue(successSb as never);

      const result = await getTickets();
      expect(result).toHaveLength(1);
    });
  });

  describe("Auth error recovery", () => {
    it("unauthenticated user gets null profile, not error", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "No session" } }) },
        from: vi.fn().mockReturnValue(chain({ data: null, error: { message: "No auth" } })),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getUserProfile } = await import("@/lib/repositories/company.repository");
      const profile = await getUserProfile();
      expect(profile).toBeNull();
    });

    it("action throws AuthError for unauthenticated user", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
        from: vi.fn().mockReturnValue(chain({ data: null })),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { createContactRequest } = await import("@/lib/actions/contact.actions");
      const { AuthError: AE } = await import("@/lib/errors");

      await expect(
        createContactRequest({
          companyId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          subject: "Test",
          urgency: "normaal",
        })
      ).rejects.toThrow(AE);
    });
  });

  describe("Database error recovery", () => {
    it("database error in action throws DatabaseError", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockReturnValue(chain({ data: null, error: { message: "Connection refused" } })),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { createContactRequest } = await import("@/lib/actions/contact.actions");
      const { DatabaseError: DE } = await import("@/lib/errors");

      await expect(
        createContactRequest({
          companyId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          subject: "Test request",
          urgency: "normaal",
        })
      ).rejects.toThrow(DE);
    });
  });
});
