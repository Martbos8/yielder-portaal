// In-memory rate limiter for API endpoints and form submissions
// Uses a sliding window counter per key

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitEntry = {
  timestamps: number[];
};

// In-memory store (resets on server restart)
const store = new Map<string, RateLimitEntry>();

/**
 * Pre-configured rate limit profiles.
 */
export const RATE_LIMITS = {
  magicLink: { maxRequests: 5, windowMs: 15 * 60 * 1000 } as RateLimitConfig,
  contactRequest: { maxRequests: 20, windowMs: 60 * 60 * 1000 } as RateLimitConfig,
  apiCall: { maxRequests: 100, windowMs: 60 * 1000 } as RateLimitConfig,
};

/**
 * Check if a key has exceeded its rate limit.
 * Returns { allowed, remaining, resetInMs }.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  const currentCount = entry.timestamps.length;

  if (currentCount >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0] ?? now;
    const resetInMs = oldestInWindow + config.windowMs - now;

    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, resetInMs),
    };
  }

  // Add current timestamp
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxRequests - currentCount - 1,
    resetInMs: config.windowMs,
  };
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
};

/**
 * Reset rate limit for a specific key (useful for testing).
 */
export function resetRateLimit(key: string) {
  store.delete(key);
}

/**
 * Clear entire rate limit store (useful for testing).
 */
export function clearRateLimits() {
  store.clear();
}
