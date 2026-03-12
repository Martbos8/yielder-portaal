/**
 * Integration test: recommendation flow.
 * Tests: upgrade page data → recommendation engine → contact request action.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock dependencies ──────────────────────────────────────────
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
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
import { checkRateLimit } from "@/lib/rate-limit";

const mockedCreateClient = vi.mocked(createClient);
const mockedCheckRateLimit = vi.mocked(checkRateLimit);

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

// ── Valid UUIDs for schema validation ──────────────────────────
const UUID_USER = "11111111-1111-4111-8111-111111111111";
const UUID_COMPANY = "22222222-2222-4222-8222-222222222222";
const UUID_PRODUCT_FW = "33333333-3333-4333-8333-333333333333";
const UUID_PRODUCT_AV = "44444444-4444-4444-8444-444444444444";
const UUID_CAT_SEC = "55555555-5555-4555-8555-555555555555";

const testUser = { id: UUID_USER, email: "upgrade@bedrijf.nl" };

const testProducts = [
  {
    id: UUID_PRODUCT_FW,
    name: "FortiGate Firewall",
    category_id: UUID_CAT_SEC,
    vendor: "Fortinet",
    sku: "FG-100F",
    description: "Next-gen firewall",
    type: "hardware" as const,
    lifecycle_years: 5,
    is_active: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: UUID_PRODUCT_AV,
    name: "Microsoft Defender for Business",
    category_id: UUID_CAT_SEC,
    vendor: "Microsoft",
    sku: "MDB-001",
    description: "Endpoint security",
    type: "software" as const,
    lifecycle_years: null,
    is_active: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
];

describe("Recommendation Flow: upgrade → contact request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("Step 1: Load products for recommendations", () => {
    it("loads active products from repository", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "products") return chain({ data: testProducts });
          if (table === "user_company_mapping") return chain({ data: [{ company_id: UUID_COMPANY }] });
          return chain({ data: [] });
        }),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);

      const { getActiveProducts } = await import("@/lib/repositories/product.repository");
      const products = await getActiveProducts();

      expect(products.length).toBe(2);
      expect(products.some(p => p.name === "FortiGate Firewall")).toBe(true);
    });
  });

  describe("Step 2: Recommendation engine computes recommendations", () => {
    it("computes recommendations from gaps with valid scores", async () => {
      const { computeRecommendations } = await import("@/lib/engine/recommendation");

      const categoryMap = new Map<string, string>([[UUID_CAT_SEC, "Security"]]);

      const gaps = [
        {
          missingProduct: testProducts[0]!,
          reason: "Geen firewall aanwezig",
          severity: "critical" as const,
          relatedTo: testProducts[1]!,
        },
      ];

      const recommendations = computeRecommendations(gaps, [], categoryMap);
      expect(recommendations.length).toBeGreaterThan(0);

      for (const rec of recommendations) {
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.score).toBeLessThanOrEqual(100);
        expect(rec.severity).toBeDefined();
        expect(rec.product.name).toBeTruthy();
      }
    });

    it("returns empty for no gaps and no patterns", async () => {
      const { computeRecommendations } = await import("@/lib/engine/recommendation");
      const recommendations = computeRecommendations([], [], new Map());
      expect(recommendations).toHaveLength(0);
    });
  });

  describe("Step 3: Create contact request from recommendation", () => {
    it("creates contact request with product reference", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockReturnValue(chain({ data: null, error: null })),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);
      mockedCheckRateLimit.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetInMs: 60000,
        warning: false,
        limit: 10,
        resetAt: Math.floor(Date.now() / 1000) + 60,
      });

      const { createContactRequest } = await import("@/lib/actions/contact.actions");
      const result = await createContactRequest({
        companyId: UUID_COMPANY,
        subject: "Interesse in FortiGate Firewall",
        message: "Graag meer informatie over de firewall oplossing.",
        productId: UUID_PRODUCT_FW,
        urgency: "normaal",
      });

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith("contact_requests");
    });

    it("rejects contact request when rate limited", async () => {
      const supabase = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: testUser }, error: null }) },
        from: vi.fn().mockReturnValue(chain({ data: null })),
      };
      mockedCreateClient.mockResolvedValue(supabase as never);
      mockedCheckRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetInMs: 30000,
        warning: false,
        limit: 5,
        resetAt: Math.floor(Date.now() / 1000) + 30,
      });

      const { createContactRequest } = await import("@/lib/actions/contact.actions");
      const { RateLimitError } = await import("@/lib/errors");

      await expect(
        createContactRequest({
          companyId: UUID_COMPANY,
          subject: "Interesse in product",
          urgency: "normaal",
        })
      ).rejects.toThrow(RateLimitError);
    });
  });

  describe("Step 4: End-to-end data consistency", () => {
    it("product ID from recommendation matches contact request product", async () => {
      const productId = testProducts[0]!.id;
      const productName = testProducts[0]!.name;

      const { ContactRequestSchema } = await import("@/lib/schemas");
      const parsed = ContactRequestSchema.safeParse({
        companyId: UUID_COMPANY,
        subject: `Interesse in ${productName}`,
        message: "Details graag",
        productId,
        urgency: "normaal",
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.productId).toBe(productId);
      }
    });
  });
});
