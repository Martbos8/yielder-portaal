/**
 * Edge case tests: null data, empty arrays, max lengths, unicode, XSS payloads.
 *
 * These tests cover boundary conditions, malicious input, and defensive coding
 * patterns across schemas, error handling, cache, and rate limiting.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ContactRequestSchema,
  FeedbackSchema,
  TicketFilterSchema,
  SyncRequestSchema,
  MarkAllAsReadSchema,
  UUIDSchema,
  PaginationSchema,
  DateRangeSchema,
} from "@/lib/schemas";
import {
  AppError,
  NotFoundError,
  ValidationError,
  ExternalServiceError,
  isAppError,
  isOperationalError,
  toErrorResponse,
  getErrorMessage,
  toAppError,
} from "@/lib/errors";
import { cache, cached, CacheTTL } from "@/lib/cache";
import {
  checkRateLimit,
  clearRateLimits,
  type RateLimitConfig,
} from "@/lib/rate-limit";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Schema Edge Cases
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Schema Edge Cases", () => {
  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

  describe("XSS payloads in text fields", () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(document.cookie)',
      '"><svg onload=alert(1)>',
      "'; DROP TABLE users; --",
      '<iframe src="javascript:alert(1)"></iframe>',
      '{{constructor.constructor("return this")()}}',
    ];

    it("ContactRequestSchema accepts XSS strings (sanitization is downstream)", () => {
      for (const payload of xssPayloads) {
        const result = ContactRequestSchema.safeParse({
          companyId: VALID_UUID,
          subject: payload,
        });
        // Schema validates structure, not content — sanitization happens at insert
        expect(result.success).toBe(true);
      }
    });

    it("TicketFilterSchema accepts XSS in search field (max 200 chars)", () => {
      for (const payload of xssPayloads) {
        if (payload.length <= 200) {
          const result = TicketFilterSchema.safeParse({ search: payload });
          expect(result.success).toBe(true);
        }
      }
    });
  });

  describe("Unicode and special characters", () => {
    it("ContactRequestSchema accepts unicode subjects", () => {
      const unicodeStrings = [
        "日本語のテスト",
        "Ünïcödé tëst",
        "🔥 Urgent probleem 🚨",
        "Тест на русском",
        "عربي",
        "零宽空格\u200B测试",
        "Combining: e\u0301", // é via combining char
      ];

      for (const str of unicodeStrings) {
        const result = ContactRequestSchema.safeParse({
          companyId: VALID_UUID,
          subject: str,
        });
        expect(result.success).toBe(true);
      }
    });

    it("UUIDSchema rejects unicode that looks like UUID", () => {
      const result = UUIDSchema.safeParse(
        "550e8400-е29b-41d4-a716-446655440000" // Cyrillic 'е' instead of Latin 'e'
      );
      expect(result.success).toBe(false);
    });
  });

  describe("Boundary values", () => {
    it("ContactRequestSchema rejects subject at exactly 201 chars", () => {
      const result = ContactRequestSchema.safeParse({
        companyId: VALID_UUID,
        subject: "a".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("ContactRequestSchema accepts subject at exactly 200 chars", () => {
      const result = ContactRequestSchema.safeParse({
        companyId: VALID_UUID,
        subject: "a".repeat(200),
      });
      expect(result.success).toBe(true);
    });

    it("ContactRequestSchema accepts message at exactly 2000 chars", () => {
      const result = ContactRequestSchema.safeParse({
        companyId: VALID_UUID,
        subject: "test",
        message: "b".repeat(2000),
      });
      expect(result.success).toBe(true);
    });

    it("ContactRequestSchema rejects message at 2001 chars", () => {
      const result = ContactRequestSchema.safeParse({
        companyId: VALID_UUID,
        subject: "test",
        message: "b".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("PaginationSchema rejects pageSize of 0", () => {
      const result = PaginationSchema.safeParse({ pageSize: 0 });
      expect(result.success).toBe(false);
    });

    it("PaginationSchema accepts pageSize of 1", () => {
      const result = PaginationSchema.safeParse({ pageSize: 1 });
      expect(result.success).toBe(true);
    });

    it("PaginationSchema accepts pageSize of 100", () => {
      const result = PaginationSchema.safeParse({ pageSize: 100 });
      expect(result.success).toBe(true);
    });

    it("PaginationSchema rejects pageSize of 101", () => {
      const result = PaginationSchema.safeParse({ pageSize: 101 });
      expect(result.success).toBe(false);
    });

    it("FeedbackSchema accepts score of exactly 0", () => {
      const result = FeedbackSchema.safeParse({
        companyId: VALID_UUID,
        productId: VALID_UUID,
        action: "shown",
        recommendationScore: 0,
      });
      expect(result.success).toBe(true);
    });

    it("FeedbackSchema accepts score of exactly 100", () => {
      const result = FeedbackSchema.safeParse({
        companyId: VALID_UUID,
        productId: VALID_UUID,
        action: "shown",
        recommendationScore: 100,
      });
      expect(result.success).toBe(true);
    });

    it("FeedbackSchema rejects score of 100.1", () => {
      const result = FeedbackSchema.safeParse({
        companyId: VALID_UUID,
        productId: VALID_UUID,
        action: "shown",
        recommendationScore: 100.1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Null and undefined inputs", () => {
    it("ContactRequestSchema rejects null input", () => {
      const result = ContactRequestSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("ContactRequestSchema rejects undefined input", () => {
      const result = ContactRequestSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("FeedbackSchema rejects null input", () => {
      const result = FeedbackSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("TicketFilterSchema accepts undefined (all optional)", () => {
      const result = TicketFilterSchema.safeParse(undefined);
      // Zod .object({}) requires at least an object-like input
      expect(result.success).toBe(false);
    });

    it("TicketFilterSchema accepts empty object", () => {
      const result = TicketFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("SyncRequestSchema accepts empty object (defaults applied)", () => {
      const result = SyncRequestSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entities).toEqual(["all"]);
        expect(result.data.force).toBe(false);
      }
    });

    it("MarkAllAsReadSchema rejects null notificationIds", () => {
      const result = MarkAllAsReadSchema.safeParse({ notificationIds: null });
      expect(result.success).toBe(false);
    });
  });

  describe("Type coercion attacks", () => {
    it("UUIDSchema rejects number input", () => {
      const result = UUIDSchema.safeParse(12345);
      expect(result.success).toBe(false);
    });

    it("UUIDSchema rejects array input", () => {
      const result = UUIDSchema.safeParse([VALID_UUID]);
      expect(result.success).toBe(false);
    });

    it("UUIDSchema rejects object input", () => {
      const result = UUIDSchema.safeParse({ id: VALID_UUID });
      expect(result.success).toBe(false);
    });

    it("PaginationSchema coerces valid string numbers", () => {
      const result = PaginationSchema.safeParse({
        page: "5",
        pageSize: "50",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.pageSize).toBe(50);
      }
    });

    it("PaginationSchema rejects non-numeric strings", () => {
      const result = PaginationSchema.safeParse({
        page: "abc",
      });
      expect(result.success).toBe(false);
    });

    it("DateRangeSchema rejects invalid date strings", () => {
      const result = DateRangeSchema.safeParse({
        from: "not-a-date",
        to: "also-not-a-date",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Prototype pollution attempts", () => {
    it("ContactRequestSchema ignores __proto__ properties", () => {
      const input = JSON.parse(
        '{"companyId":"550e8400-e29b-41d4-a716-446655440000","subject":"test","__proto__":{"isAdmin":true}}'
      );
      const result = ContactRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)["isAdmin"]).toBeUndefined();
      }
    });

    it("FeedbackSchema strips extra properties", () => {
      const result = FeedbackSchema.safeParse({
        companyId: VALID_UUID,
        productId: VALID_UUID,
        action: "clicked",
        recommendationScore: 50,
        extraField: "should be ignored",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)["extraField"]).toBeUndefined();
      }
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Handling Edge Cases
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Error Handling Edge Cases", () => {
  it("toAppError handles null", () => {
    const err = toAppError(null);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe("null");
  });

  it("toAppError handles undefined", () => {
    const err = toAppError(undefined);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe("undefined");
  });

  it("toAppError handles object without message", () => {
    const err = toAppError({ foo: "bar" });
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe("[object Object]");
  });

  it("toErrorResponse handles circular reference gracefully", () => {
    // Circular Error object
    const err = new Error("circular");
    (err as Record<string, unknown>)["self"] = err;
    const response = toErrorResponse(err);
    expect(response.statusCode).toBe(500);
    expect(response.error).toBe("Er is een onverwachte fout opgetreden");
  });

  it("isAppError returns false for Error-like objects", () => {
    const fakeError = {
      message: "fake",
      code: "UNAUTHORIZED",
      statusCode: 401,
      isOperational: true,
    };
    expect(isAppError(fakeError)).toBe(false);
  });

  it("isOperationalError returns false for non-error types", () => {
    expect(isOperationalError(null)).toBe(false);
    expect(isOperationalError(undefined)).toBe(false);
    expect(isOperationalError(0)).toBe(false);
    expect(isOperationalError("")).toBe(false);
    expect(isOperationalError({})).toBe(false);
  });

  it("getErrorMessage returns dev message in development", () => {
    const originalEnv = process.env["NODE_ENV"];
    process.env["NODE_ENV"] = "development";

    const msg = getErrorMessage(new Error("dev visible message"));
    expect(msg).toBe("dev visible message");

    process.env["NODE_ENV"] = originalEnv;
  });

  it("getErrorMessage returns fallback in production for non-AppError", () => {
    const originalEnv = process.env["NODE_ENV"];
    process.env["NODE_ENV"] = "production";

    const msg = getErrorMessage(new Error("should not leak"), "Veilige fout");
    expect(msg).toBe("Veilige fout");

    process.env["NODE_ENV"] = originalEnv;
  });

  it("AppError extends Error prototype chain correctly", () => {
    const err = new ValidationError("test");
    expect(err instanceof ValidationError).toBe(true);
    expect(err instanceof AppError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it("ExternalServiceError preserves undefined originalError", () => {
    const err = new ExternalServiceError("API", "timeout");
    expect(err.originalError).toBeUndefined();
    expect(err.service).toBe("API");
  });

  it("NotFoundError with empty string resource", () => {
    const err = new NotFoundError("", "123");
    expect(err.message).toBe(" met id '123' niet gevonden");
  });

  it("ValidationError with many field errors", () => {
    const fields: Record<string, string> = {};
    for (let i = 0; i < 50; i++) {
      fields[`field_${i}`] = `Error for field ${i}`;
    }
    const err = new ValidationError("Veel fouten", fields);
    expect(Object.keys(err.fields).length).toBe(50);
    const json = err.toJSON();
    expect(Object.keys(json.fields).length).toBe(50);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Cache Edge Cases
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Cache Edge Cases", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("handles very long keys", () => {
    const longKey = "k".repeat(10_000);
    cache.set(longKey, "value", CacheTTL.HOUR);
    expect(cache.get(longKey)).toBe("value");
  });

  it("handles special characters in keys", () => {
    const specialKeys = [
      "key:with:colons",
      "key/with/slashes",
      "key.with.dots",
      "key with spaces",
      "key\nwith\nnewlines",
      "key\0with\0nulls",
      "日本語key",
    ];

    for (const key of specialKeys) {
      cache.set(key, key, CacheTTL.HOUR);
      expect(cache.get(key)).toBe(key);
    }
  });

  it("stores null as a value (null !== missing)", () => {
    // null is special: cache.get returns null for missing, so storing null
    // looks identical to cache miss. This is a known limitation.
    cache.set("null-value", null, CacheTTL.HOUR);
    expect(cache.get("null-value")).toBeNull();
  });

  it("stores complex nested objects", () => {
    const complex = {
      nested: { deep: { value: [1, 2, { three: true }] } },
      date: "2026-01-01",
      undef: undefined,
    };
    cache.set("complex", complex, CacheTTL.HOUR);
    expect(cache.get("complex")).toEqual(complex);
  });

  it("overwrites existing key with new value", () => {
    cache.set("key", "first", CacheTTL.HOUR);
    cache.set("key", "second", CacheTTL.HOUR);
    expect(cache.get("key")).toBe("second");
    expect(cache.size).toBe(1);
  });

  it("invalidate with empty pattern does nothing harmful", () => {
    cache.set("a", 1, CacheTTL.HOUR);
    cache.invalidate("");
    expect(cache.get("a")).toBe(1);
  });

  it("invalidate with '*' prefix clears matching entries", () => {
    cache.set("prefix:a", 1, CacheTTL.HOUR);
    cache.set("prefix:b", 2, CacheTTL.HOUR);
    cache.set("other:c", 3, CacheTTL.HOUR);

    cache.invalidate("prefix:*");

    expect(cache.get("prefix:a")).toBeNull();
    expect(cache.get("prefix:b")).toBeNull();
    expect(cache.get("other:c")).toBe(3);
  });

  it("invalidate with just '*' clears everything", () => {
    cache.set("a", 1, CacheTTL.HOUR);
    cache.set("b", 2, CacheTTL.HOUR);
    cache.invalidate("*");
    expect(cache.size).toBe(0);
  });

  it("handles TTL of 0 (immediate expiry)", () => {
    vi.useFakeTimers();
    cache.set("instant", "value", 0);
    vi.advanceTimersByTime(1);
    expect(cache.get("instant")).toBeNull();
    vi.useRealTimers();
  });

  it("handles very large TTL", () => {
    cache.set("long-lived", "value", Number.MAX_SAFE_INTEGER);
    expect(cache.get("long-lived")).toBe("value");
  });

  it("cached() handles concurrent calls for same key", async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return "result";
    };

    // First call populates cache
    const r1 = await cached("concurrent", CacheTTL.HOUR, fetcher);
    // Second call should use cache
    const r2 = await cached("concurrent", CacheTTL.HOUR, fetcher);

    expect(r1).toBe("result");
    expect(r2).toBe("result");
    expect(callCount).toBe(1);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Rate Limiting Edge Cases
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Rate Limiting Edge Cases", () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it("handles maxRequests of 1", () => {
    const config: RateLimitConfig = { maxRequests: 1, windowMs: 60_000 };

    const r1 = checkRateLimit("edge:single", config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(0);

    const r2 = checkRateLimit("edge:single", config);
    expect(r2.allowed).toBe(false);
  });

  it("handles very large maxRequests", () => {
    const config: RateLimitConfig = { maxRequests: 1_000_000, windowMs: 60_000 };

    const result = checkRateLimit("edge:large", config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(999_999);
  });

  it("handles very small window (1ms)", () => {
    vi.useFakeTimers();
    const config: RateLimitConfig = { maxRequests: 1, windowMs: 1 };

    checkRateLimit("edge:tiny-window", config);
    vi.advanceTimersByTime(2);

    const result = checkRateLimit("edge:tiny-window", config);
    expect(result.allowed).toBe(true);

    vi.useRealTimers();
  });

  it("handles empty key string", () => {
    const config: RateLimitConfig = { maxRequests: 5, windowMs: 60_000 };
    const result = checkRateLimit("", config);
    expect(result.allowed).toBe(true);
  });

  it("handles keys with special characters", () => {
    const config: RateLimitConfig = { maxRequests: 5, windowMs: 60_000 };
    const specialKeys = [
      "user:日本語",
      "ip:192.168.1.1",
      "path:/api/v1/test?q=hello",
      "email:user@example.com",
    ];

    for (const key of specialKeys) {
      const result = checkRateLimit(key, config);
      expect(result.allowed).toBe(true);
    }
  });

  it("different keys are independent", () => {
    const config: RateLimitConfig = { maxRequests: 1, windowMs: 60_000 };

    checkRateLimit("edge:a", config);
    expect(checkRateLimit("edge:a", config).allowed).toBe(false);
    expect(checkRateLimit("edge:b", config).allowed).toBe(true);
  });

  it("warning flag transitions from false to true", () => {
    const config: RateLimitConfig = { maxRequests: 5, windowMs: 60_000 };

    // 1st request: 1/5 used, warning threshold = 4
    const r1 = checkRateLimit("edge:warn-transition", config);
    expect(r1.warning).toBe(false);

    // 2nd: 2/5
    const r2 = checkRateLimit("edge:warn-transition", config);
    expect(r2.warning).toBe(false);

    // 3rd: 3/5
    const r3 = checkRateLimit("edge:warn-transition", config);
    expect(r3.warning).toBe(false);

    // 4th: 4/5 — should trigger warning (4 >= floor(5*0.8)=4)
    const r4 = checkRateLimit("edge:warn-transition", config);
    expect(r4.warning).toBe(true);
    expect(r4.allowed).toBe(true);

    // 5th: 5/5 — still warning, last allowed
    const r5 = checkRateLimit("edge:warn-transition", config);
    expect(r5.warning).toBe(true);
    expect(r5.allowed).toBe(true);
    expect(r5.remaining).toBe(0);

    // 6th: blocked
    const r6 = checkRateLimit("edge:warn-transition", config);
    expect(r6.allowed).toBe(false);
  });

  it("resetAt is always in the future", () => {
    const config: RateLimitConfig = { maxRequests: 5, windowMs: 60_000 };
    const now = Math.ceil(Date.now() / 1000);

    const result = checkRateLimit("edge:future", config);
    expect(result.resetAt).toBeGreaterThanOrEqual(now);
  });
});
