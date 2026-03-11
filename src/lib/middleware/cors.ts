import { NextRequest, NextResponse } from "next/server";

const CORS_METHODS = "GET, POST, PUT, DELETE, OPTIONS";
const CORS_HEADERS =
  "Content-Type, Authorization, X-Sync-Secret, X-Request-Id";
const CORS_MAX_AGE = "86400";

/**
 * Allowed origins for CORS. In production, restrict to the actual domain.
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  const appUrl = process.env["NEXT_PUBLIC_APP_URL"];
  if (appUrl) {
    origins.push(appUrl);
  }

  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  if (supabaseUrl) {
    origins.push(supabaseUrl);
  }

  return origins;
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

/**
 * Handle CORS for a request.
 *
 * When called with only `request` (preflight): returns a 204 response or null
 * if origin is not allowed.
 *
 * When called with `request` and `response`: applies CORS headers to the
 * existing response and returns void.
 */
export function applyCorsHeaders(
  request: NextRequest
): NextResponse | null;
export function applyCorsHeaders(
  request: NextRequest,
  response: NextResponse
): void;
export function applyCorsHeaders(
  request: NextRequest,
  response?: NextResponse
): NextResponse | null | void {
  const origin = request.headers.get("origin");

  // Preflight mode (no response provided)
  if (response === undefined) {
    if (request.method !== "OPTIONS") return null;

    const preflightResponse = new NextResponse(null, { status: 204 });
    if (isAllowedOrigin(origin)) {
      preflightResponse.headers.set("Access-Control-Allow-Origin", origin!);
      preflightResponse.headers.set(
        "Access-Control-Allow-Credentials",
        "true"
      );
    }
    preflightResponse.headers.set("Access-Control-Allow-Methods", CORS_METHODS);
    preflightResponse.headers.set("Access-Control-Allow-Headers", CORS_HEADERS);
    preflightResponse.headers.set("Access-Control-Max-Age", CORS_MAX_AGE);
    return preflightResponse;
  }

  // Regular response mode — apply headers to existing response
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
}
