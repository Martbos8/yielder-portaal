import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  checkCompoundRateLimit,
  clearRateLimits,
  isWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
  buildRateLimitHeaders,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { stripPii } from "@/lib/audit";
import {
  sanitizeText,
  sanitizeSubject,
  sanitizeMessage,
} from "@/lib/sanitize";

describe("Rate limiter", () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it("allows requests within limit", () => {
    const result = checkRateLimit("test-user", { maxRequests: 3, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.limit).toBe(3);
    expect(result.warning).toBe(false);
  });

  it("blocks requests after limit exceeded", () => {
    const config = { maxRequests: 3, windowMs: 60000 };
    checkRateLimit("test-user-2", config);
    checkRateLimit("test-user-2", config);
    checkRateLimit("test-user-2", config);
    const result = checkRateLimit("test-user-2", config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.warning).toBe(true);
  });

  it("tracks remaining correctly", () => {
    const config = { maxRequests: 5, windowMs: 60000 };
    const r1 = checkRateLimit("test-user-3", config);
    expect(r1.remaining).toBe(4);
    const r2 = checkRateLimit("test-user-3", config);
    expect(r2.remaining).toBe(3);
  });

  it("sets warning flag at 80% usage", () => {
    const config = { maxRequests: 10, windowMs: 60000 };
    // 80% threshold = floor(10*0.8) = 8 timestamps in window
    for (let i = 0; i < 8; i++) {
      checkRateLimit("warn-test", config);
    }
    // 9th request — currentCount is 8, which is >= threshold (8)
    const r9 = checkRateLimit("warn-test", config);
    expect(r9.warning).toBe(true);
    expect(r9.allowed).toBe(true);
  });

  it("no warning below 80% usage", () => {
    const config = { maxRequests: 10, windowMs: 60000 };
    // 7 requests — currentCount will be 7 which is < 8
    for (let i = 0; i < 7; i++) {
      checkRateLimit("no-warn-test", config);
    }
    const r8 = checkRateLimit("no-warn-test", config);
    expect(r8.warning).toBe(false);
    expect(r8.allowed).toBe(true);
  });

  it("has predefined rate limit profiles", () => {
    expect(RATE_LIMITS.magicLink.maxRequests).toBe(5);
    expect(RATE_LIMITS.magicLink.windowMs).toBe(15 * 60 * 1000);
    expect(RATE_LIMITS.contactRequest.maxRequests).toBe(20);
    expect(RATE_LIMITS.contactRequest.windowMs).toBe(60 * 60 * 1000);
    expect(RATE_LIMITS.apiCall.maxRequests).toBe(100);
    expect(RATE_LIMITS.apiCall.windowMs).toBe(60 * 1000);
  });

  it("different keys have independent limits", () => {
    const config = { maxRequests: 1, windowMs: 60000 };
    checkRateLimit("user-a", config);
    const resultA = checkRateLimit("user-a", config);
    expect(resultA.allowed).toBe(false);

    const resultB = checkRateLimit("user-b", config);
    expect(resultB.allowed).toBe(true);
  });

  it("includes resetAt as unix timestamp", () => {
    const before = Math.floor(Date.now() / 1000);
    const result = checkRateLimit("reset-test", { maxRequests: 5, windowMs: 60000 });
    expect(result.resetAt).toBeGreaterThanOrEqual(before);
  });
});

describe("Rate limiter — whitelist", () => {
  it("bypasses rate limit for whitelisted keys", () => {
    const config = { maxRequests: 1, windowMs: 60000 };
    // "127.0.0.1" is whitelisted by default
    const r1 = checkRateLimit("127.0.0.1", config);
    const r2 = checkRateLimit("127.0.0.1", config);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1); // stays full
  });

  it("bypasses for prefix-matched whitelist keys", () => {
    const config = { maxRequests: 1, windowMs: 60000 };
    const r1 = checkRateLimit("internal:scheduler", config);
    const r2 = checkRateLimit("internal:scheduler", config);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });

  it("isWhitelisted detects default entries", () => {
    expect(isWhitelisted("127.0.0.1")).toBe(true);
    expect(isWhitelisted("::1")).toBe(true);
    expect(isWhitelisted("internal")).toBe(true);
    expect(isWhitelisted("10.0.0.1")).toBe(false);
  });

  it("addToWhitelist and removeFromWhitelist work", () => {
    expect(isWhitelisted("custom-service")).toBe(false);
    addToWhitelist("custom-service");
    expect(isWhitelisted("custom-service")).toBe(true);
    removeFromWhitelist("custom-service");
    expect(isWhitelisted("custom-service")).toBe(false);
  });
});

describe("Rate limiter — compound", () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it("checks both user and IP independently", () => {
    const config = { maxRequests: 2, windowMs: 60000 };
    // First request for user
    const r1 = checkCompoundRateLimit("user-1", "1.2.3.4", "test", config);
    expect(r1.allowed).toBe(true);

    // Second request for same user, different IP
    const r2 = checkCompoundRateLimit("user-1", "5.6.7.8", "test", config);
    expect(r2.allowed).toBe(true);

    // Third for same user — should be blocked by user key
    const r3 = checkCompoundRateLimit("user-1", "9.9.9.9", "test", config);
    expect(r3.allowed).toBe(false);
  });

  it("blocks by IP when no userId", () => {
    const config = { maxRequests: 1, windowMs: 60000 };
    checkCompoundRateLimit(undefined, "1.2.3.4", "test", config);
    const r2 = checkCompoundRateLimit(undefined, "1.2.3.4", "test", config);
    expect(r2.allowed).toBe(false);
  });

  it("returns the more restrictive result", () => {
    const config = { maxRequests: 3, windowMs: 60000 };
    // Exhaust user limit from different IPs
    checkCompoundRateLimit("user-x", "ip-a", "test2", config);
    checkCompoundRateLimit("user-x", "ip-b", "test2", config);
    checkCompoundRateLimit("user-x", "ip-c", "test2", config);

    // User is exhausted even though this IP is fresh
    const r = checkCompoundRateLimit("user-x", "ip-d", "test2", config);
    expect(r.allowed).toBe(false);
  });
});

describe("Rate limiter — buildRateLimitHeaders", () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it("includes standard headers for allowed request", () => {
    const result = checkRateLimit("header-test", { maxRequests: 10, windowMs: 60000 });
    const headers = buildRateLimitHeaders(result);
    expect(headers["X-RateLimit-Limit"]).toBe("10");
    expect(headers["X-RateLimit-Remaining"]).toBe("9");
    expect(headers["X-RateLimit-Reset"]).toBeDefined();
    expect(headers["X-RateLimit-Warning"]).toBeUndefined();
    expect(headers["Retry-After"]).toBeUndefined();
  });

  it("includes warning header when in warning zone", () => {
    const config = { maxRequests: 10, windowMs: 60000 };
    for (let i = 0; i < 8; i++) {
      checkRateLimit("warn-header-test", config);
    }
    const result = checkRateLimit("warn-header-test", config);
    const headers = buildRateLimitHeaders(result);
    expect(headers["X-RateLimit-Warning"]).toBe("Rate limit usage exceeds 80%");
  });

  it("includes Retry-After header when blocked", () => {
    const config = { maxRequests: 1, windowMs: 60000 };
    checkRateLimit("blocked-header-test", config);
    const result = checkRateLimit("blocked-header-test", config);
    const headers = buildRateLimitHeaders(result);
    expect(result.allowed).toBe(false);
    expect(headers["Retry-After"]).toBeDefined();
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
    expect(headers["X-RateLimit-Warning"]).toBeDefined();
  });
});

describe("Audit — PII stripping", () => {
  it("strips password fields", () => {
    const result = stripPii({ username: "jan", password: "secret123" });
    expect(result["username"]).toBe("jan");
    expect(result["password"]).toBe("[REDACTED]");
  });

  it("strips nested PII fields", () => {
    const result = stripPii({
      user: { name: "Jan", token: "abc123" },
    });
    expect((result["user"] as Record<string, unknown>)["name"]).toBe("Jan");
    expect((result["user"] as Record<string, unknown>)["token"]).toBe("[REDACTED]");
  });

  it("strips BSN and IBAN", () => {
    const result = stripPii({ bsn: "123456789", iban: "NL91ABNA041" });
    expect(result["bsn"]).toBe("[REDACTED]");
    expect(result["iban"]).toBe("[REDACTED]");
  });

  it("preserves safe fields", () => {
    const result = stripPii({ action: "login", company_id: "123" });
    expect(result["action"]).toBe("login");
    expect(result["company_id"]).toBe("123");
  });

  it("logAudit function is exportable", async () => {
    const mod = await import("@/lib/audit");
    expect(mod.logAudit).toBeDefined();
    expect(typeof mod.logAudit).toBe("function");
  });
});

describe("Input sanitization", () => {
  it("strips HTML tags", () => {
    expect(sanitizeText("<script>alert('xss')</script>")).toBe("alert('xss')");
    expect(sanitizeText("<b>bold</b>")).toBe("bold");
  });

  it("trims whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("sanitizeSubject limits length", () => {
    const long = "A".repeat(300);
    expect(sanitizeSubject(long).length).toBe(200);
  });

  it("sanitizeMessage limits length", () => {
    const long = "B".repeat(3000);
    expect(sanitizeMessage(long).length).toBe(2000);
  });

  it("preserves normal text", () => {
    expect(sanitizeText("Interesse in Cloud Backup")).toBe("Interesse in Cloud Backup");
  });

  it("handles special characters", () => {
    expect(sanitizeText("prijs: €100 & BTW")).toBe("prijs: €100 & BTW");
  });
});
