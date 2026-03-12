import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ---------- Mocks ----------

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      }),
    },
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkCompoundRateLimit: vi.fn().mockReturnValue({
    allowed: true,
    remaining: 99,
    resetInMs: 60000,
    warning: false,
    limit: 100,
    resetAt: Math.ceil(Date.now() / 1000) + 60,
  }),
  RATE_LIMITS: {
    apiCall: { maxRequests: 100, windowMs: 60_000 },
    contactRequest: { maxRequests: 20, windowMs: 3600_000 },
    magicLink: { maxRequests: 5, windowMs: 900_000 },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: () => logger,
    };
    return logger;
  },
}));

import { createApiHandler } from "@/lib/api/middleware";
import { createClient } from "@/lib/supabase/server";
import { checkCompoundRateLimit } from "@/lib/rate-limit";

const mockedCreateClient = vi.mocked(createClient);
const mockedCheckCompoundRateLimit = vi.mocked(checkCompoundRateLimit);

function createRequest(options: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  url?: string;
} = {}): NextRequest {
  const {
    method = "POST",
    body,
    headers = {},
    url = "http://localhost:3000/api/test",
  } = options;

  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
}

describe("createApiHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCheckCompoundRateLimit.mockReturnValue({
      allowed: true,
      remaining: 99,
      resetInMs: 60000,
      warning: false,
      limit: 100,
      resetAt: Math.ceil(Date.now() / 1000) + 60,
    });
  });

  it("executes handler and returns response", async () => {
    const handler = createApiHandler({
      handler: async () => NextResponse.json({ ok: true }),
    });

    const req = createRequest();
    const res = await handler(req);
    const data = await res.json();

    expect(data.ok).toBe(true);
    expect(res.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("adds X-Request-Id from request header", async () => {
    const handler = createApiHandler({
      handler: async () => NextResponse.json({ ok: true }),
    });

    const req = createRequest({ headers: { "x-request-id": "custom-id-123" } });
    const res = await handler(req);

    expect(res.headers.get("X-Request-Id")).toBe("custom-id-123");
  });

  describe("Authentication", () => {
    it("passes userId to handler when auth is true", async () => {
      let capturedUserId: string | undefined;
      const handler = createApiHandler({
        auth: true,
        handler: async (_req, ctx) => {
          capturedUserId = ctx.userId;
          return NextResponse.json({ ok: true });
        },
      });

      const req = createRequest();
      await handler(req);
      expect(capturedUserId).toBe("user-123");
    });

    it("returns 401 when user is not authenticated", async () => {
      mockedCreateClient.mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Not authenticated" },
          }),
        },
      } as never);

      const handler = createApiHandler({
        auth: true,
        handler: async () => NextResponse.json({ ok: true }),
      });

      const req = createRequest();
      const res = await handler(req);
      expect(res.status).toBe(401);
    });

    it("validates secret auth", async () => {
      vi.stubEnv("TEST_SECRET", "my-secret-key");

      const handler = createApiHandler({
        secretAuth: { headerName: "x-api-key", envVar: "TEST_SECRET" },
        handler: async () => NextResponse.json({ ok: true }),
      });

      // Valid secret
      const goodReq = createRequest({ headers: { "x-api-key": "my-secret-key" } });
      const goodRes = await handler(goodReq);
      expect(goodRes.status).toBe(200);

      // Invalid secret
      const badReq = createRequest({ headers: { "x-api-key": "wrong-key" } });
      const badRes = await handler(badReq);
      expect(badRes.status).toBe(401);

      vi.unstubAllEnvs();
    });
  });

  describe("Rate Limiting", () => {
    it("adds rate limit headers to response", async () => {
      const handler = createApiHandler({
        rateLimit: "apiCall",
        handler: async () => NextResponse.json({ ok: true }),
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.headers.get("X-RateLimit-Limit")).toBe("100");
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("99");
      expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
    });

    it("returns 429 when rate limited", async () => {
      mockedCheckCompoundRateLimit.mockReturnValueOnce({
        allowed: false,
        remaining: 0,
        resetInMs: 30000,
        warning: true,
        limit: 100,
        resetAt: Math.ceil(Date.now() / 1000) + 30,
      });

      const handler = createApiHandler({
        rateLimit: "apiCall",
        handler: async () => NextResponse.json({ ok: true }),
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBeTruthy();
    });

    it("adds warning header at 80% usage", async () => {
      mockedCheckCompoundRateLimit.mockReturnValueOnce({
        allowed: true,
        remaining: 10,
        resetInMs: 60000,
        warning: true,
        limit: 100,
        resetAt: Math.ceil(Date.now() / 1000) + 60,
      });

      const handler = createApiHandler({
        rateLimit: "apiCall",
        handler: async () => NextResponse.json({ ok: true }),
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.headers.get("X-RateLimit-Warning")).toBeTruthy();
    });
  });

  describe("Body Validation", () => {
    const TestSchema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });

    it("validates and passes body to handler", async () => {
      let capturedBody: unknown;
      const handler = createApiHandler({
        validation: TestSchema,
        handler: async (_req, ctx) => {
          capturedBody = ctx.body;
          return NextResponse.json({ ok: true });
        },
      });

      const req = createRequest({ body: { name: "Jan", age: 30 } });
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(capturedBody).toEqual({ name: "Jan", age: 30 });
    });

    it("returns 400 for invalid body", async () => {
      const handler = createApiHandler({
        validation: TestSchema,
        handler: async () => NextResponse.json({ ok: true }),
      });

      const req = createRequest({ body: { name: "", age: -1 } });
      const res = await handler(req);

      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid JSON", async () => {
      const handler = createApiHandler({
        validation: TestSchema,
        handler: async () => NextResponse.json({ ok: true }),
      });

      const req = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        body: "not json{",
        headers: { "content-type": "text/plain" },
      });
      const res = await handler(req);

      expect(res.status).toBe(400);
    });
  });

  describe("Error Handling", () => {
    it("catches unexpected errors and returns 500", async () => {
      const handler = createApiHandler({
        handler: async () => {
          throw new Error("Unexpected boom");
        },
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("preserves request ID in error responses", async () => {
      const handler = createApiHandler({
        handler: async () => {
          throw new Error("fail");
        },
      });

      const req = createRequest({ headers: { "x-request-id": "err-123" } });
      const res = await handler(req);

      expect(res.headers.get("X-Request-Id")).toBe("err-123");
    });
  });

  describe("Middleware Composition", () => {
    it("applies auth + rate limit + validation together", async () => {
      const Schema = z.object({ msg: z.string() });

      let capturedCtx: { userId?: string; body?: unknown } = {};
      const handler = createApiHandler({
        auth: true,
        rateLimit: "apiCall",
        validation: Schema,
        handler: async (_req, ctx) => {
          capturedCtx = { userId: ctx.userId, body: ctx.body };
          return NextResponse.json({ ok: true });
        },
      });

      const req = createRequest({ body: { msg: "hello" } });
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(capturedCtx.userId).toBe("user-123");
      expect(capturedCtx.body).toEqual({ msg: "hello" });
      expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy();
    });
  });
});
