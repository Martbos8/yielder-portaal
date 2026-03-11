import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  clearRateLimits,
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
  });

  it("blocks requests after limit exceeded", () => {
    const config = { maxRequests: 3, windowMs: 60000 };
    checkRateLimit("test-user-2", config);
    checkRateLimit("test-user-2", config);
    checkRateLimit("test-user-2", config);
    const result = checkRateLimit("test-user-2", config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks remaining correctly", () => {
    const config = { maxRequests: 5, windowMs: 60000 };
    const r1 = checkRateLimit("test-user-3", config);
    expect(r1.remaining).toBe(4);
    const r2 = checkRateLimit("test-user-3", config);
    expect(r2.remaining).toBe(3);
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
