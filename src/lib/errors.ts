/**
 * Centralized error handling for the Yielder portal.
 * Custom error classes with structured error codes and operational flags.
 *
 * - Operational errors (isOperational=true): expected failures like auth, validation, not found.
 *   These are safe to show to the user.
 * - Non-operational errors (isOperational=false): programming bugs, unexpected failures,
 *   external service outages. These should be logged and shown as generic messages.
 */

/** Error codes for structured error identification */
export const ErrorCode = {
  // Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  FORBIDDEN: "FORBIDDEN",
  // Not found
  NOT_FOUND: "NOT_FOUND",
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  // Rate limit
  RATE_LIMIT: "RATE_LIMIT",
  // External services
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  // Database
  DATABASE_ERROR: "DATABASE_ERROR",
  // Configuration
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  // Generic
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Base application error. All custom errors extend this class.
 */
export class AppError extends Error {
  readonly code: ErrorCodeType;
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCodeType = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): { error: string; code: ErrorCodeType; statusCode: number } {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

/** Authentication and authorization errors (401/403) */
export class AuthError extends AppError {
  constructor(message: string = "Niet geautoriseerd") {
    super(message, ErrorCode.UNAUTHORIZED, 401, true);
    this.name = "AuthError";
  }
}

/** Resource not found errors (404) */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", id?: string) {
    const msg = id
      ? `${resource} met id '${id}' niet gevonden`
      : `${resource} niet gevonden`;
    super(msg, ErrorCode.NOT_FOUND, 404, true);
    this.name = "NotFoundError";
  }
}

/** Input validation errors (400) with per-field details */
export class ValidationError extends AppError {
  readonly fields: Record<string, string>;

  constructor(message: string = "Ongeldige invoer", fields: Record<string, string> = {}) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true);
    this.name = "ValidationError";
    this.fields = fields;
  }

  override toJSON(): {
    error: string;
    code: ErrorCodeType;
    statusCode: number;
    fields: Record<string, string>;
  } {
    return { ...super.toJSON(), fields: this.fields };
  }
}

/** Rate limit exceeded errors (429) */
export class RateLimitError extends AppError {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number = 60_000) {
    super(
      "Te veel verzoeken, probeer het later opnieuw",
      ErrorCode.RATE_LIMIT,
      429,
      true
    );
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

/** Database errors — unexpected, non-operational */
export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, ErrorCode.DATABASE_ERROR, 500, false);
    this.name = "DatabaseError";
  }
}

/** External service errors (ConnectWise, ScalePad, etc.) — non-operational */
export class ExternalServiceError extends AppError {
  readonly service: string;
  readonly originalError?: unknown;

  constructor(service: string, message: string, originalError?: unknown) {
    super(`${service}: ${message}`, ErrorCode.EXTERNAL_SERVICE_ERROR, 502, false);
    this.name = "ExternalServiceError";
    this.service = service;
    this.originalError = originalError;
  }
}

/** Configuration errors (missing env vars, etc.) — non-operational */
export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, ErrorCode.CONFIGURATION_ERROR, 500, false);
    this.name = "ConfigurationError";
  }
}

// --- Type Guards ---

/** Check if an error is an AppError (or subclass) */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Check if an error is operational (expected, handled gracefully) */
export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}

/**
 * Convert unknown error to a safe API response object.
 * Operational errors expose their message; non-operational errors use a generic message.
 */
export function toErrorResponse(error: unknown): {
  error: string;
  code: string;
  statusCode: number;
} {
  if (isAppError(error)) {
    return {
      error: error.isOperational
        ? error.message
        : "Er is een onverwachte fout opgetreden",
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  return {
    error: "Er is een onverwachte fout opgetreden",
    code: ErrorCode.INTERNAL_ERROR,
    statusCode: 500,
  };
}

/**
 * Extract a safe error message from any thrown value.
 * Shows real message for operational errors; generic fallback otherwise.
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = "Er is een onverwachte fout opgetreden"
): string {
  if (isAppError(error) && error.isOperational) {
    return error.message;
  }
  if (error instanceof Error && process.env['NODE_ENV'] === "development") {
    return error.message;
  }
  return fallback;
}

/**
 * Wrap an unknown caught value into an AppError.
 * Already-AppError instances are returned as-is.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError(error.message, ErrorCode.INTERNAL_ERROR, 500, false);
  }
  return new AppError(String(error), ErrorCode.INTERNAL_ERROR, 500, false);
}
