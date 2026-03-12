// In-memory rate limiter for API endpoints and form submissions
// Sliding window counter per key with graduated responses and whitelist

export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitEntry = {
  timestamps: number[];
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  /** True when usage exceeds 80% of the limit (warning zone) */
  warning: boolean;
  /** Current limit ceiling */
  limit: number;
  /** Unix timestamp (seconds) when the window resets */
  resetAt: number;
};

// In-memory store (resets on server restart)
const store = new Map<string, RateLimitEntry>();

/** Warning threshold — graduated response starts at 80% usage */
const WARNING_THRESHOLD = 0.8;

/**
 * Keys / prefixes that bypass rate limiting (internal services, health checks).
 */
const whitelist = new Set<string>([
  "internal",
  "127.0.0.1",
  "::1",
]);

/**
 * Pre-configured rate limit profiles.
 */
export const RATE_LIMITS = {
  magicLink: { maxRequests: 5, windowMs: 15 * 60 * 1000 } as RateLimitConfig,
  contactRequest: { maxRequests: 20, windowMs: 60 * 60 * 1000 } as RateLimitConfig,
  apiCall: { maxRequests: 100, windowMs: 60 * 1000 } as RateLimitConfig,
};

/**
 * Returns true if the given key is whitelisted (internal service, localhost).
 */
export function isWhitelisted(key: string): boolean {
  if (whitelist.has(key)) return true;
  const entries = Array.from(whitelist);
  for (let i = 0; i < entries.length; i++) {
    const prefix = entries[i]!;
    if (key.startsWith(`${prefix}:`)) return true;
  }
  return false;
}

/**
 * Add a key to the rate-limit whitelist.
 */
export function addToWhitelist(key: string): void {
  whitelist.add(key);
}

/**
 * Remove a key from the whitelist (useful for testing).
 */
export function removeFromWhitelist(key: string): void {
  whitelist.delete(key);
}

/**
 * Check if a key has exceeded its rate limit (sliding window).
 *
 * Graduated response: `warning` is true when usage exceeds 80% of the limit.
 * Whitelisted keys always return allowed with full remaining.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const resetAt = Math.ceil((now + config.windowMs) / 1000);

  // Bypass for whitelisted keys
  if (isWhitelisted(key)) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetInMs: config.windowMs,
      warning: false,
      limit: config.maxRequests,
      resetAt,
    };
  }

  const windowStart = now - config.windowMs;

  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the sliding window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  const currentCount = entry.timestamps.length;
  const warningThresholdCount = Math.floor(config.maxRequests * WARNING_THRESHOLD);

  if (currentCount >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0] ?? now;
    const resetInMs = Math.max(0, oldestInWindow + config.windowMs - now);

    return {
      allowed: false,
      remaining: 0,
      resetInMs,
      warning: true,
      limit: config.maxRequests,
      resetAt: Math.ceil((now + resetInMs) / 1000),
    };
  }

  // Add current timestamp
  entry.timestamps.push(now);

  const remaining = config.maxRequests - currentCount - 1;
  const warning = currentCount >= warningThresholdCount;

  return {
    allowed: true,
    remaining,
    resetInMs: config.windowMs,
    warning,
    limit: config.maxRequests,
    resetAt,
  };
}

/**
 * Check rate limit for both user ID and IP independently.
 * Both keys must be allowed; returns the more restrictive result.
 */
export function checkCompoundRateLimit(
  userId: string | undefined,
  ip: string,
  profileKey: string,
  config: RateLimitConfig
): RateLimitResult {
  const ipResult = checkRateLimit(`api:${profileKey}:ip:${ip}`, config);

  if (userId) {
    const userResult = checkRateLimit(`api:${profileKey}:user:${userId}`, config);

    // If either is blocked, return the blocked one
    if (!ipResult.allowed || !userResult.allowed) {
      return ipResult.allowed ? userResult : ipResult;
    }

    // Both allowed — return the more restrictive
    return userResult.remaining < ipResult.remaining ? userResult : ipResult;
  }

  return ipResult;
}

/**
 * Build standard rate limit response headers from a RateLimitResult.
 * Includes X-RateLimit-Warning when in the warning zone (>80% usage).
 */
export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
  };

  if (result.warning) {
    headers["X-RateLimit-Warning"] = "Rate limit usage exceeds 80%";
  }

  if (!result.allowed) {
    headers["Retry-After"] = String(Math.ceil(result.resetInMs / 1000));
  }

  return headers;
}

/**
 * Reset rate limit for a specific key (useful for testing).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Clear entire rate limit store (useful for testing).
 */
export function clearRateLimits(): void {
  store.clear();
}
