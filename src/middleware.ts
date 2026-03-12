import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  generateRequestId,
  applySecurityHeaders,
  applyCorsHeaders,
  checkRouteRateLimit,
  getRateLimitHeaders,
} from "@/lib/middleware";
import { createLogger } from "@/lib/logger";

const log = createLogger("middleware");

export async function middleware(request: NextRequest) {
  // 1. Generate a unique request ID for tracing
  const requestId = generateRequestId();

  // 2. Handle CORS preflight for API routes (return early)
  if (
    request.method === "OPTIONS" &&
    request.nextUrl.pathname.startsWith("/api")
  ) {
    const corsResponse = applyCorsHeaders(request);
    if (corsResponse !== null) {
      applySecurityHeaders(corsResponse, requestId);
      return corsResponse;
    }
  }

  // 3. Route-level rate limiting (returns 429 if exceeded)
  const rateLimitResponse = checkRouteRateLimit(request);
  if (rateLimitResponse) {
    log.warn("Rate limit exceeded", { requestId, route: request.nextUrl.pathname, ip: getClientIp(request) });
    applySecurityHeaders(rateLimitResponse, requestId);
    return rateLimitResponse;
  }

  // 4. Auth session refresh + redirect logic
  const response = await updateSession(request);

  // 5. Apply security headers
  applySecurityHeaders(response, requestId);

  // 6. Apply CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    applyCorsHeaders(request, response);
  }

  // 7. Apply rate limit info headers (for non-blocked requests)
  const rateLimitHeaders = getRateLimitHeaders(request);
  for (const [key, value] of Object.entries(rateLimitHeaders)) {
    response.headers.set(key, value);
  }

  // 8. Store client IP for audit trail (accessible in server components/actions)
  const clientIp = getClientIp(request);
  response.headers.set("X-Client-IP", clientIp);

  return response;
}

/** Extract client IP from proxy headers or connection. */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.ip ??
    "unknown"
  );
}

export const config = {
  matcher: [
    "/api/:path*",
    "/auth/:path*",
  ],
};
