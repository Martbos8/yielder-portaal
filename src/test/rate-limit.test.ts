import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  checkCompoundRateLimit,
  buildRateLimitHeaders,
  isWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
  resetRateLimit,
  clearRateLimits,
  RATE_LIMITS,
  type RateLimitConfig,
} from "@/lib/rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    clearRateLimits();
  });

  describe("checkRateLimit", () => {
    const config: RateLimitConfig = { maxRequests: 5, windowMs: 60_000 };

    it("allows requests under the limit", () => {
      const result = checkRateLimit("test:user1", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
      expect(result.warning).toBe(false);
    });

    it("counts requests correctly", () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit("test:user2", config);
      }
      const result = checkRateLimit("test:user2", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it("blocks requests at the limit", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test:user3", config);
      }
      const result = checkRateLimit("test:user3", config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("sets warning flag at 80% usage", () => {
      // 80% of 5 = threshold 4, warning when (currentCount+1) >= 4
      // After 3 calls, 4th call: currentCount=3, 3+1=4 >= 4 → warning
      for (let i = 0; i < 3; i++) {
        checkRateLimit("test:user4", config);
      }
      const r4 = checkRateLimit("test:user4", config);
      expect(r4.allowed).toBe(true);
      expect(r4.warning).toBe(true);
    });

    it("no warning below 80% threshold", () => {
      // threshold = floor(5*0.8) = 4, 3rd call: currentCount=2, 2+1=3 < 4 → no warning
      for (let i = 0; i < 2; i++) {
        checkRateLimit("test:no-warn", config);
      }
      const r3 = checkRateLimit("test:no-warn", config);
      expect(r3.allowed).toBe(true);
      expect(r3.warning).toBe(false);
    });

    it("resets after sliding window expires", () => {
      vi.useFakeTimers();

      for (let i = 0; i < 5; i++) {
        checkRateLimit("test:user5", config);
      }
      expect(checkRateLimit("test:user5", config).allowed).toBe(false);

      vi.advanceTimersByTime(61_000);

      const result = checkRateLimit("test:user5", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);

      vi.useRealTimers();
    });

    it("provides resetInMs for blocked requests", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test:user6", config);
      }
      const result = checkRateLimit("test:user6", config);
      expect(result.allowed).toBe(false);
      expect(result.resetInMs).toBeGreaterThan(0);
      expect(result.resetInMs).toBeLessThanOrEqual(config.windowMs);
    });

    it("provides resetAt as unix timestamp", () => {
      const result = checkRateLimit("test:user7", config);
      expect(result.resetAt).toBeGreaterThan(Date.now() / 1000);
    });
  });

  describe("Whitelist", () => {
    it("whitelists exact keys", () => {
      expect(isWhitelisted("internal")).toBe(true);
      expect(isWhitelisted("127.0.0.1")).toBe(true);
      expect(isWhitelisted("::1")).toBe(true);
    });

    it("whitelists prefixed keys", () => {
      expect(isWhitelisted("internal:cron")).toBe(true);
      expect(isWhitelisted("127.0.0.1:some-api")).toBe(true);
    });

    it("does not whitelist unknown keys", () => {
      expect(isWhitelisted("external")).toBe(false);
      expect(isWhitelisted("192.168.1.1")).toBe(false);
    });

    it("bypasses rate limiting for whitelisted keys", () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60_000 };

      checkRateLimit("internal", config);
      checkRateLimit("internal", config);
      const result = checkRateLimit("internal", config);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(config.maxRequests);
      expect(result.warning).toBe(false);
    });

    it("allows adding and removing whitelist entries", () => {
      addToWhitelist("custom-service");
      expect(isWhitelisted("custom-service")).toBe(true);

      removeFromWhitelist("custom-service");
      expect(isWhitelisted("custom-service")).toBe(false);
    });
  });

  describe("checkCompoundRateLimit", () => {
    const config: RateLimitConfig = { maxRequests: 3, windowMs: 60_000 };

    it("checks both user and IP limits", () => {
      const result = checkCompoundRateLimit("user1", "1.2.3.4", "test", config);
      expect(result.allowed).toBe(true);
    });

    it("blocks when IP limit is exceeded", () => {
      for (let i = 0; i < 3; i++) {
        checkCompoundRateLimit(undefined, "1.2.3.4", "block-ip", config);
      }
      const result = checkCompoundRateLimit(undefined, "1.2.3.4", "block-ip", config);
      expect(result.allowed).toBe(false);
    });

    it("blocks when user limit is exceeded", () => {
      for (let i = 0; i < 3; i++) {
        checkCompoundRateLimit("user-block", "10.0.0.1", "block-user", config);
      }
      const result = checkCompoundRateLimit("user-block", "10.0.0.2", "block-user", config);
      expect(result.allowed).toBe(false);
    });

    it("returns more restrictive result when both allowed", () => {
      // Use user key twice, IP key once
      checkCompoundRateLimit("user-restrict", "10.0.0.3", "restrict", config);
      const result = checkCompoundRateLimit("user-restrict", "10.0.0.4", "restrict", config);
      // User has 1 remaining (3-2), IP has 2 remaining (3-1)
      expect(result.remaining).toBe(1);
    });

    it("works without userId", () => {
      const result = checkCompoundRateLimit(undefined, "5.5.5.5", "anon", config);
      expect(result.allowed).toBe(true);
    });
  });

  describe("buildRateLimitHeaders", () => {
    it("includes standard headers for allowed requests", () => {
      const result = checkRateLimit("headers-test", { maxRequests: 10, windowMs: 60_000 });
      const headers = buildRateLimitHeaders(result);

      expect(headers["X-RateLimit-Limit"]).toBe("10");
      expect(headers["X-RateLimit-Remaining"]).toBe("9");
      expect(headers["X-RateLimit-Reset"]).toBeDefined();
      expect(headers["Retry-After"]).toBeUndefined();
    });

    it("includes warning header at 80% usage", () => {
      const config: RateLimitConfig = { maxRequests: 5, windowMs: 60_000 };
      // threshold = floor(5*0.8) = 4, need currentCount+1 >= 4 → 3 prior calls, 4th triggers
      for (let i = 0; i < 3; i++) {
        checkRateLimit("headers-warn", config);
      }
      const result = checkRateLimit("headers-warn", config);
      const headers = buildRateLimitHeaders(result);

      expect(headers["X-RateLimit-Warning"]).toBeDefined();
    });

    it("includes Retry-After header for blocked requests", () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60_000 };
      checkRateLimit("headers-blocked", config);
      const result = checkRateLimit("headers-blocked", config);
      const headers = buildRateLimitHeaders(result);

      expect(headers["Retry-After"]).toBeDefined();
      expect(Number(headers["Retry-After"])).toBeGreaterThan(0);
    });
  });

  describe("resetRateLimit / clearRateLimits", () => {
    it("resets a specific key", () => {
      const config: RateLimitConfig = { maxRequests: 2, windowMs: 60_000 };
      checkRateLimit("reset-me", config);
      checkRateLimit("reset-me", config);
      expect(checkRateLimit("reset-me", config).allowed).toBe(false);

      resetRateLimit("reset-me");
      expect(checkRateLimit("reset-me", config).allowed).toBe(true);
    });

    it("clears all keys", () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60_000 };
      checkRateLimit("clear-a", config);
      checkRateLimit("clear-b", config);

      clearRateLimits();

      expect(checkRateLimit("clear-a", config).allowed).toBe(true);
      expect(checkRateLimit("clear-b", config).allowed).toBe(true);
    });
  });

  describe("RATE_LIMITS profiles", () => {
    it("has expected profiles", () => {
      expect(RATE_LIMITS.magicLink).toEqual({ maxRequests: 5, windowMs: 15 * 60 * 1000 });
      expect(RATE_LIMITS.contactRequest).toEqual({ maxRequests: 20, windowMs: 60 * 60 * 1000 });
      expect(RATE_LIMITS.apiCall).toEqual({ maxRequests: 100, windowMs: 60 * 1000 });
    });
  });
});
