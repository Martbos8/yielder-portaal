import { describe, it, expect, vi } from "vitest";
import {
  AppError,
  AuthError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  ConfigurationError,
  ErrorCode,
  isAppError,
  isOperationalError,
  toErrorResponse,
  getErrorMessage,
  toAppError,
} from "@/lib/errors";

// --- AppError ---

describe("AppError", () => {
  it("creates with defaults", () => {
    const err = new AppError("test");
    expect(err.message).toBe("test");
    expect(err.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
    expect(err.name).toBe("AppError");
  });

  it("creates with custom values", () => {
    const err = new AppError("custom", ErrorCode.UNAUTHORIZED, 401, false);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.statusCode).toBe(401);
    expect(err.isOperational).toBe(false);
  });

  it("is instance of Error", () => {
    const err = new AppError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it("serializes to JSON", () => {
    const err = new AppError("json test", ErrorCode.NOT_FOUND, 404);
    const json = err.toJSON();
    expect(json).toEqual({
      error: "json test",
      code: "NOT_FOUND",
      statusCode: 404,
    });
  });
});

// --- AuthError ---

describe("AuthError", () => {
  it("creates with default message", () => {
    const err = new AuthError();
    expect(err.message).toBe("Niet geautoriseerd");
    expect(err.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(err.statusCode).toBe(401);
    expect(err.isOperational).toBe(true);
    expect(err.name).toBe("AuthError");
  });

  it("creates with custom message", () => {
    const err = new AuthError("Sessie verlopen");
    expect(err.message).toBe("Sessie verlopen");
  });

  it("is instance of AppError", () => {
    expect(new AuthError()).toBeInstanceOf(AppError);
  });
});

// --- NotFoundError ---

describe("NotFoundError", () => {
  it("creates with resource name only", () => {
    const err = new NotFoundError("Ticket");
    expect(err.message).toBe("Ticket niet gevonden");
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
  });

  it("creates with resource and id", () => {
    const err = new NotFoundError("Ticket", "abc-123");
    expect(err.message).toBe("Ticket met id 'abc-123' niet gevonden");
  });

  it("creates with default resource", () => {
    const err = new NotFoundError();
    expect(err.message).toBe("Resource niet gevonden");
  });
});

// --- ValidationError ---

describe("ValidationError", () => {
  it("creates with default message", () => {
    const err = new ValidationError();
    expect(err.message).toBe("Ongeldige invoer");
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
    expect(err.fields).toEqual({});
  });

  it("creates with field errors", () => {
    const err = new ValidationError("Validatie mislukt", {
      email: "Ongeldig e-mailadres",
      name: "Naam is verplicht",
    });
    expect(err.fields).toEqual({
      email: "Ongeldig e-mailadres",
      name: "Naam is verplicht",
    });
  });

  it("serializes fields to JSON", () => {
    const err = new ValidationError("Fout", { email: "Ongeldig" });
    const json = err.toJSON();
    expect(json.fields).toEqual({ email: "Ongeldig" });
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});

// --- RateLimitError ---

describe("RateLimitError", () => {
  it("creates with default retryAfterMs", () => {
    const err = new RateLimitError();
    expect(err.retryAfterMs).toBe(60_000);
    expect(err.statusCode).toBe(429);
    expect(err.isOperational).toBe(true);
  });

  it("creates with custom retryAfterMs", () => {
    const err = new RateLimitError(30_000);
    expect(err.retryAfterMs).toBe(30_000);
  });
});

// --- DatabaseError ---

describe("DatabaseError", () => {
  it("is non-operational", () => {
    const err = new DatabaseError("Connection lost");
    expect(err.isOperational).toBe(false);
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(err.name).toBe("DatabaseError");
  });
});

// --- ExternalServiceError ---

describe("ExternalServiceError", () => {
  it("includes service name in message", () => {
    const err = new ExternalServiceError("ConnectWise", "API error: 503");
    expect(err.message).toBe("ConnectWise: API error: 503");
    expect(err.service).toBe("ConnectWise");
    expect(err.isOperational).toBe(false);
    expect(err.statusCode).toBe(502);
  });

  it("stores original error", () => {
    const original = new Error("network timeout");
    const err = new ExternalServiceError("ScalePad", "Timeout", original);
    expect(err.originalError).toBe(original);
  });
});

// --- ConfigurationError ---

describe("ConfigurationError", () => {
  it("is non-operational", () => {
    const err = new ConfigurationError("Missing API key");
    expect(err.isOperational).toBe(false);
    expect(err.code).toBe(ErrorCode.CONFIGURATION_ERROR);
    expect(err.statusCode).toBe(500);
  });
});

// --- Type Guards ---

describe("isAppError", () => {
  it("returns true for AppError", () => {
    expect(isAppError(new AppError("test"))).toBe(true);
  });

  it("returns true for subclasses", () => {
    expect(isAppError(new AuthError())).toBe(true);
    expect(isAppError(new NotFoundError())).toBe(true);
    expect(isAppError(new ValidationError())).toBe(true);
    expect(isAppError(new RateLimitError())).toBe(true);
    expect(isAppError(new DatabaseError("db"))).toBe(true);
    expect(isAppError(new ExternalServiceError("svc", "err"))).toBe(true);
    expect(isAppError(new ConfigurationError("cfg"))).toBe(true);
  });

  it("returns false for plain Error", () => {
    expect(isAppError(new Error("plain"))).toBe(false);
  });

  it("returns false for non-errors", () => {
    expect(isAppError("string")).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError(42)).toBe(false);
    expect(isAppError({})).toBe(false);
  });
});

describe("isOperationalError", () => {
  it("returns true for operational errors", () => {
    expect(isOperationalError(new AuthError())).toBe(true);
    expect(isOperationalError(new NotFoundError())).toBe(true);
    expect(isOperationalError(new ValidationError())).toBe(true);
    expect(isOperationalError(new RateLimitError())).toBe(true);
  });

  it("returns false for non-operational errors", () => {
    expect(isOperationalError(new DatabaseError("db"))).toBe(false);
    expect(isOperationalError(new ExternalServiceError("svc", "err"))).toBe(false);
    expect(isOperationalError(new ConfigurationError("cfg"))).toBe(false);
  });

  it("returns false for non-AppError", () => {
    expect(isOperationalError(new Error("plain"))).toBe(false);
    expect(isOperationalError("string")).toBe(false);
  });
});

// --- toErrorResponse ---

describe("toErrorResponse", () => {
  it("returns operational error message for operational errors", () => {
    const response = toErrorResponse(new AuthError("Sessie verlopen"));
    expect(response).toEqual({
      error: "Sessie verlopen",
      code: "UNAUTHORIZED",
      statusCode: 401,
    });
  });

  it("hides message for non-operational errors", () => {
    const response = toErrorResponse(new DatabaseError("SQL injection attempt"));
    expect(response.error).toBe("Er is een onverwachte fout opgetreden");
    expect(response.code).toBe("DATABASE_ERROR");
    expect(response.statusCode).toBe(500);
  });

  it("returns generic response for plain errors", () => {
    const response = toErrorResponse(new Error("something"));
    expect(response).toEqual({
      error: "Er is een onverwachte fout opgetreden",
      code: "INTERNAL_ERROR",
      statusCode: 500,
    });
  });

  it("returns generic response for non-error values", () => {
    const response = toErrorResponse("string error");
    expect(response.error).toBe("Er is een onverwachte fout opgetreden");
  });
});

// --- getErrorMessage ---

describe("getErrorMessage", () => {
  it("returns message for operational errors", () => {
    expect(getErrorMessage(new AuthError("Sessie verlopen"))).toBe("Sessie verlopen");
  });

  it("returns fallback for non-operational errors in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getErrorMessage(new DatabaseError("secret db info"))).toBe(
      "Er is een onverwachte fout opgetreden"
    );
    vi.unstubAllEnvs();
  });

  it("returns custom fallback", () => {
    expect(getErrorMessage("unknown", "Aangepaste fout")).toBe("Aangepaste fout");
  });
});

// --- toAppError ---

describe("toAppError", () => {
  it("returns AppError as-is", () => {
    const err = new AuthError();
    expect(toAppError(err)).toBe(err);
  });

  it("wraps plain Error", () => {
    const err = new Error("plain");
    const wrapped = toAppError(err);
    expect(wrapped).toBeInstanceOf(AppError);
    expect(wrapped.message).toBe("plain");
    expect(wrapped.isOperational).toBe(false);
  });

  it("wraps string", () => {
    const wrapped = toAppError("string error");
    expect(wrapped).toBeInstanceOf(AppError);
    expect(wrapped.message).toBe("string error");
    expect(wrapped.isOperational).toBe(false);
  });

  it("wraps number", () => {
    const wrapped = toAppError(404);
    expect(wrapped.message).toBe("404");
  });
});

// --- ErrorCode constants ---

describe("ErrorCode", () => {
  it("has all expected codes", () => {
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.RATE_LIMIT).toBe("RATE_LIMIT");
    expect(ErrorCode.DATABASE_ERROR).toBe("DATABASE_ERROR");
    expect(ErrorCode.EXTERNAL_SERVICE_ERROR).toBe("EXTERNAL_SERVICE_ERROR");
    expect(ErrorCode.CONFIGURATION_ERROR).toBe("CONFIGURATION_ERROR");
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(ErrorCode.SESSION_EXPIRED).toBe("SESSION_EXPIRED");
    expect(ErrorCode.FORBIDDEN).toBe("FORBIDDEN");
  });
});
