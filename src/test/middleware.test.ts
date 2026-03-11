import { describe, it, expect, beforeEach } from "vitest";
import {
  clearRouteRateLimits,
  checkRouteRateLimit,
  getRateLimitHeaders,
} from "@/lib/middleware/route-rate-limit";
import { generateRequestId } from "@/lib/middleware/request-id";
import { NextRequest } from "next/server";

function createRequest(
  path: string,
  options?: { method?: string; headers?: Record<string, string> }
): NextRequest {
  const url = `http://localhost:3000${path}`;
  return new NextRequest(url, {
    method: options?.method ?? "GET",
    headers: options?.headers,
  });
}

describe("Request ID generation", () => {
  it("generates a valid UUID", () => {
    const id = generateRequestId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateRequestId()));
    expect(ids.size).toBe(100);
  });
});

describe("Route-level rate limiting", () => {
  beforeEach(() => {
    clearRouteRateLimits();
  });

  it("allows requests within limit for /api/ routes", () => {
    const req = createRequest("/api/test");
    const result = checkRouteRateLimit(req);
    expect(result).toBeUndefined();
  });

  it("returns 429 when /api/sync limit is exceeded", () => {
    // /api/sync has a limit of 10 per minute
    for (let i = 0; i < 10; i++) {
      const result = checkRouteRateLimit(createRequest("/api/sync/connectwise"));
      expect(result).toBeUndefined();
    }

    const blocked = checkRouteRateLimit(createRequest("/api/sync/connectwise"));
    expect(blocked).toBeDefined();
    expect(blocked?.status).toBe(429);
  });

  it("includes rate limit headers on 429 response", () => {
    for (let i = 0; i < 10; i++) {
      checkRouteRateLimit(createRequest("/api/sync/test"));
    }

    const blocked = checkRouteRateLimit(createRequest("/api/sync/test"));
    expect(blocked).toBeDefined();
    expect(blocked?.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(blocked?.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(blocked?.headers.get("Retry-After")).toBeDefined();
  });

  it("does not rate-limit non-configured routes", () => {
    const req = createRequest("/dashboard");
    const result = checkRouteRateLimit(req);
    expect(result).toBeUndefined();
  });

  it("provides rate limit info headers for allowed requests", () => {
    const req = createRequest("/api/test");
    checkRouteRateLimit(req);
    const headers = getRateLimitHeaders(req);
    expect(headers["X-RateLimit-Limit"]).toBe("100");
    expect(headers["X-RateLimit-Remaining"]).toBeDefined();
  });

  it("returns empty headers for non-rate-limited routes", () => {
    const req = createRequest("/dashboard");
    const headers = getRateLimitHeaders(req);
    expect(Object.keys(headers).length).toBe(0);
  });

  it("rate limits /login route", () => {
    for (let i = 0; i < 30; i++) {
      const result = checkRouteRateLimit(createRequest("/login"));
      expect(result).toBeUndefined();
    }
    const blocked = checkRouteRateLimit(createRequest("/login"));
    expect(blocked).toBeDefined();
    expect(blocked?.status).toBe(429);
  });
});

describe("Security headers module", () => {
  it("exports applySecurityHeaders", async () => {
    const mod = await import("@/lib/middleware/security-headers");
    expect(mod.applySecurityHeaders).toBeDefined();
    expect(typeof mod.applySecurityHeaders).toBe("function");
  });
});

describe("CORS module", () => {
  it("exports applyCorsHeaders", async () => {
    const mod = await import("@/lib/middleware/cors");
    expect(mod.applyCorsHeaders).toBeDefined();
    expect(typeof mod.applyCorsHeaders).toBe("function");
  });
});
