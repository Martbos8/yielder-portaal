import { NextRequest, NextResponse } from "next/server";
import { type ZodType } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  AuthError,
  RateLimitError,
  ValidationError,
  isAppError,
  toErrorResponse,
} from "@/lib/errors";
import { checkRateLimit, RATE_LIMITS, type RateLimitResult } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:middleware");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RateLimitProfile = keyof typeof RATE_LIMITS;

/** Context passed to the handler after middleware processing */
interface HandlerContext<TBody = unknown> {
  /** Parsed + validated request body (only if validation schema provided) */
  body: TBody;
  /** Authenticated user ID (only if auth: true) */
  userId: string | undefined;
  /** Request ID from headers */
  requestId: string;
  /** Logger scoped to this request */
  log: ReturnType<typeof createLogger>;
}

/** Configuration for createApiHandler */
interface ApiHandlerConfig<TBody = unknown> {
  /**
   * Require authentication via Supabase session.
   * If true, returns 401 when no valid session is found.
   */
  auth?: boolean;

  /**
   * Require a secret header for service-to-service auth.
   * Object with headerName and envVar to check against.
   */
  secretAuth?: {
    headerName: string;
    envVar: string;
  };

  /**
   * Rate limit profile name or custom config.
   */
  rateLimit?: RateLimitProfile | { maxRequests: number; windowMs: number };

  /**
   * Zod schema for request body validation.
   */
  validation?: ZodType<TBody>;

  /**
   * Audit action name — logged after successful handler execution.
   */
  audit?: string;

  /**
   * The actual request handler.
   */
  handler: (req: NextRequest, ctx: HandlerContext<TBody>) => Promise<NextResponse>;
}

// ---------------------------------------------------------------------------
// Individual middleware wrappers
// ---------------------------------------------------------------------------

/**
 * Authenticate via Supabase session. Returns user ID or throws AuthError.
 */
async function authenticateUser(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("Niet geautoriseerd — geen geldige sessie");
  }

  return user.id;
}

/**
 * Authenticate via shared secret header. Throws AuthError on mismatch.
 */
function authenticateSecret(
  request: NextRequest,
  headerName: string,
  envVar: string
): void {
  const secret = request.headers.get(headerName);
  const expected = process.env[envVar];

  if (!expected || secret !== expected) {
    throw new AuthError("Ongeldige credentials");
  }
}

/**
 * Check rate limit for the given key and config. Throws RateLimitError if exceeded.
 * Returns the rate limit result for adding response headers.
 */
function enforceRateLimit(
  key: string,
  profile: RateLimitProfile | { maxRequests: number; windowMs: number }
): RateLimitResult {
  const config = typeof profile === "string" ? RATE_LIMITS[profile] : profile;
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    throw new RateLimitError(result.resetInMs);
  }

  return result;
}

/**
 * Parse and validate request body with a Zod schema. Throws ValidationError on failure.
 */
async function validateBody<T>(
  request: NextRequest,
  schema: ZodType<T>
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ValidationError("Ongeldig JSON formaat in request body");
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      fields[path || "_root"] = issue.message;
    }
    throw new ValidationError("Validatiefout in request body", fields);
  }

  return result.data;
}

/**
 * Add rate limit headers to a response.
 */
function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  config: { maxRequests: number; windowMs: number }
): void {
  response.headers.set("X-RateLimit-Limit", String(config.maxRequests));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil((Date.now() + result.resetInMs) / 1000))
  );
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

/**
 * Create an API route handler with composable middleware.
 *
 * @example
 * ```ts
 * export const POST = createApiHandler({
 *   auth: true,
 *   rateLimit: "contactRequest",
 *   validation: ContactRequestSchema,
 *   audit: "contact_request_created",
 *   handler: async (req, { user, body, log }) => {
 *     // ... business logic
 *     return NextResponse.json({ success: true });
 *   },
 * });
 * ```
 */
export function createApiHandler<TBody = unknown>(
  config: ApiHandlerConfig<TBody>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
    const reqLog = log.child({ requestId, route: request.nextUrl.pathname });
    const start = Date.now();

    try {
      // 1. Secret-based auth (service-to-service)
      if (config.secretAuth) {
        authenticateSecret(request, config.secretAuth.headerName, config.secretAuth.envVar);
      }

      // 2. Session-based auth
      let userId: string | undefined;
      if (config.auth) {
        userId = await authenticateUser();
        reqLog.info("Authenticated request", { userId });
      }

      // 3. Rate limiting
      let rateLimitResult: RateLimitResult | undefined;
      if (config.rateLimit) {
        const rateLimitKey = userId
          ?? request.headers.get("x-forwarded-for")
          ?? request.headers.get("x-real-ip")
          ?? "anonymous";
        const profileKey = typeof config.rateLimit === "string"
          ? config.rateLimit
          : "custom";
        rateLimitResult = enforceRateLimit(
          `api:${profileKey}:${rateLimitKey}`,
          config.rateLimit
        );
      }

      // 4. Body validation
      let body: TBody = undefined as TBody;
      if (config.validation) {
        body = await validateBody(request, config.validation);
      }

      // 5. Execute handler
      const response = await config.handler(request, {
        body,
        userId,
        requestId,
        log: reqLog,
      });

      // 6. Add rate limit headers
      if (rateLimitResult && config.rateLimit) {
        const rlConfig = typeof config.rateLimit === "string"
          ? RATE_LIMITS[config.rateLimit]
          : config.rateLimit;
        addRateLimitHeaders(response, rateLimitResult, rlConfig);
      }

      // 7. Audit logging
      if (config.audit) {
        const durationMs = Date.now() - start;
        reqLog.info(`Action completed: ${config.audit}`, { durationMs, userId });
      }

      // 8. Add request ID to response
      response.headers.set("X-Request-Id", requestId);

      return response;
    } catch (error) {
      const durationMs = Date.now() - start;

      if (isAppError(error)) {
        if (!error.isOperational) {
          reqLog.error("Non-operational error in API handler", { error, durationMs });
        } else {
          reqLog.warn("Operational error in API handler", {
            code: error.code,
            message: error.message,
            durationMs,
          });
        }
      } else {
        reqLog.error("Unexpected error in API handler", { error, durationMs });
      }

      const errResponse = toErrorResponse(error);
      const response = NextResponse.json(
        { error: errResponse.error, code: errResponse.code },
        { status: errResponse.statusCode }
      );

      // Add Retry-After for rate limit errors
      if (error instanceof RateLimitError) {
        response.headers.set("Retry-After", String(Math.ceil(error.retryAfterMs / 1000)));
      }

      response.headers.set("X-Request-Id", requestId);
      return response;
    }
  };
}

// Re-export for convenience
export type { ApiHandlerConfig, HandlerContext };
