import { NextResponse } from "next/server";

/**
 * Security headers injected at the middleware level.
 * Static headers (X-Frame-Options, CSP, etc.) are in next.config.mjs.
 * These are runtime/per-request headers that benefit from middleware context.
 */
const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "magnetometer=()",
  "gyroscope=()",
  "accelerometer=()",
].join(", ");

/** Apply security headers and request ID to a NextResponse. */
export function applySecurityHeaders(
  response: NextResponse,
  requestId: string
): void {
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("Permissions-Policy", PERMISSIONS_POLICY);
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
}
