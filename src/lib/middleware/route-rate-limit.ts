import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  buildRateLimitHeaders,
  clearRateLimits,
  type RateLimitConfig,
  type RateLimitResult,
} from "@/lib/rate-limit";

/**
 * Route-level rate limit configuration.
 * Maps route prefixes to their rate limit profiles.
 */
const ROUTE_LIMITS: Record<string, RateLimitConfig> = {
  "/api/sync": { maxRequests: 10, windowMs: 60 * 1000 },
  "/api/": { maxRequests: 100, windowMs: 60 * 1000 },
  "/login": { maxRequests: 30, windowMs: 60 * 1000 },
};

/** Sorted route prefixes (most specific first) for matching */
const SORTED_PREFIXES = Object.keys(ROUTE_LIMITS).sort(
  (a, b) => b.length - a.length
);

/** Cache the last rate limit result per request key for getRateLimitHeaders */
const lastResultCache = new Map<string, RateLimitResult>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function findRouteMatch(
  pathname: string
): { config: RateLimitConfig; prefix: string } | undefined {
  for (let i = 0; i < SORTED_PREFIXES.length; i++) {
    const prefix = SORTED_PREFIXES[i];
    if (prefix === undefined) continue;
    if (pathname.startsWith(prefix)) {
      const config = ROUTE_LIMITS[prefix];
      if (config) return { config, prefix };
    }
  }
  return undefined;
}

function buildKey(ip: string, prefix: string): string {
  return `route:${ip}:${prefix}`;
}

/**
 * Apply route-level rate limiting.
 * Returns a 429 response if the limit is exceeded, or undefined to continue.
 * Uses sliding window algorithm with whitelist and graduated warning support.
 */
export function checkRouteRateLimit(
  request: NextRequest
): NextResponse | undefined {
  const match = findRouteMatch(request.nextUrl.pathname);
  if (!match) return undefined;

  const ip = getClientIp(request);
  const key = buildKey(ip, match.prefix);

  const result = checkRateLimit(key, match.config);

  // Cache result so getRateLimitHeaders doesn't double-count
  lastResultCache.set(key, result);

  if (!result.allowed) {
    const headers = buildRateLimitHeaders(result);
    return NextResponse.json(
      { error: "Te veel verzoeken. Probeer het later opnieuw." },
      { status: 429, headers }
    );
  }

  return undefined;
}

/**
 * Get rate limit info headers for the current request (for non-blocked requests).
 * Includes X-RateLimit-Warning when usage exceeds 80%.
 * Uses cached result from checkRouteRateLimit to avoid double-counting.
 */
export function getRateLimitHeaders(
  request: NextRequest
): Record<string, string> {
  const match = findRouteMatch(request.nextUrl.pathname);
  if (!match) return {};

  const ip = getClientIp(request);
  const key = buildKey(ip, match.prefix);

  // Use cached result from checkRouteRateLimit (avoids double-counting)
  const cached = lastResultCache.get(key);
  if (cached) {
    return buildRateLimitHeaders(cached);
  }

  return {};
}

/** Clear store — for testing */
export function clearRouteRateLimits(): void {
  clearRateLimits();
  lastResultCache.clear();
}
