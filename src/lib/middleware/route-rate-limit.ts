import { NextRequest, NextResponse } from "next/server";

/**
 * Route-level rate limit configuration.
 * Maps route prefixes to their rate limit profiles.
 */
type RouteRateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

const ROUTE_LIMITS: Record<string, RouteRateLimitConfig> = {
  "/api/sync": { maxRequests: 10, windowMs: 60 * 1000 },
  "/api/": { maxRequests: 100, windowMs: 60 * 1000 },
  "/login": { maxRequests: 30, windowMs: 60 * 1000 },
};

type RateLimitEntry = {
  timestamps: number[];
};

/** In-memory store keyed by "ip:routePrefix" */
const store = new Map<string, RateLimitEntry>();

/** Periodically clean expired entries to prevent memory leaks */
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  store.forEach((entry, key) => {
    // Remove entries with no recent timestamps
    if (entry.timestamps.length === 0) {
      store.delete(key);
      return;
    }
    const latest = entry.timestamps[entry.timestamps.length - 1];
    // If latest timestamp is older than 1 hour, remove
    if (latest !== undefined && now - latest > 60 * 60 * 1000) {
      store.delete(key);
    }
  });
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function findRouteConfig(
  pathname: string
): RouteRateLimitConfig | undefined {
  // Match most specific route first
  for (const prefix of Object.keys(ROUTE_LIMITS).sort(
    (a, b) => b.length - a.length
  )) {
    if (pathname.startsWith(prefix)) {
      return ROUTE_LIMITS[prefix];
    }
  }
  return undefined;
}

/**
 * Apply route-level rate limiting.
 * Returns a 429 response if the limit is exceeded, or undefined to continue.
 */
export function checkRouteRateLimit(
  request: NextRequest
): NextResponse | undefined {
  const config = findRouteConfig(request.nextUrl.pathname);
  if (!config) return undefined;

  cleanupExpiredEntries();

  const ip = getClientIp(request);
  const routePrefix =
    Object.keys(ROUTE_LIMITS)
      .sort((a, b) => b.length - a.length)
      .find((p) => request.nextUrl.pathname.startsWith(p)) ?? "";
  const key = `${ip}:${routePrefix}`;

  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Sliding window: remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  const resetMs = config.windowMs;

  if (entry.timestamps.length >= config.maxRequests) {
    const resetAt = Math.ceil((now + resetMs) / 1000);
    const retryAfter = Math.ceil(resetMs / 1000);

    return NextResponse.json(
      { error: "Te veel verzoeken. Probeer het later opnieuw." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(resetAt),
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  entry.timestamps.push(now);

  // Rate limit info headers are applied in the main middleware
  return undefined;
}

/**
 * Get rate limit info headers for the current request (for non-blocked requests).
 */
export function getRateLimitHeaders(
  request: NextRequest
): Record<string, string> {
  const config = findRouteConfig(request.nextUrl.pathname);
  if (!config) return {};

  const ip = getClientIp(request);
  const routePrefix =
    Object.keys(ROUTE_LIMITS)
      .sort((a, b) => b.length - a.length)
      .find((p) => request.nextUrl.pathname.startsWith(p)) ?? "";
  const key = `${ip}:${routePrefix}`;
  const entry = store.get(key);
  const count = entry?.timestamps.length ?? 0;
  const remaining = Math.max(0, config.maxRequests - count);
  const resetAt = Math.ceil((Date.now() + config.windowMs) / 1000);

  return {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(resetAt),
  };
}

/** Clear store — for testing */
export function clearRouteRateLimits(): void {
  store.clear();
}
