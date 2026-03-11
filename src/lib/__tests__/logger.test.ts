import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Logger, createLogger, redactObject, withTiming } from "../logger";

describe("Logger", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("outputs JSON in production", () => {
    const log = new Logger({ service: "test" });
    log.info("hello world");

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = consoleSpy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("hello world");
    expect(parsed.context.service).toBe("test");
    expect(parsed.timestamp).toBeDefined();
  });

  it("includes error details in log entry", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = new Logger();
    const testError = new Error("test failure");
    testError.name = "TestError";
    log.error("something failed", { error: testError });

    const output = errorSpy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.error.name).toBe("TestError");
    expect(parsed.error.message).toBe("test failure");
    expect(parsed.error.stack).toBeDefined();
  });

  it("includes durationMs in log entry", () => {
    const log = new Logger();
    log.info("query complete", { durationMs: 123 });

    const output = consoleSpy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.durationMs).toBe(123);
  });

  it("child logger merges context", () => {
    const parent = new Logger({ service: "api" });
    const child = parent.child({ requestId: "abc-123" });
    child.info("request handled");

    const output = consoleSpy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.context.service).toBe("api");
    expect(parsed.context.requestId).toBe("abc-123");
  });

  it("suppresses debug in production", () => {
    const log = new Logger();
    log.debug("should not appear");
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("suppresses debug and info in test env", () => {
    vi.stubEnv("NODE_ENV", "test");
    const log = new Logger();
    log.debug("nope");
    log.info("nope");
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("allows warn in test env", () => {
    vi.stubEnv("NODE_ENV", "test");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const log = new Logger();
    log.warn("this should appear");
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe("createLogger", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("creates a logger with service context", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const log = createLogger("my-service");
    log.info("hello");

    const output = spy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.context.service).toBe("my-service");
  });
});

describe("redactObject", () => {
  it("redacts PII fields", () => {
    const input = { name: "Jan", password: "secret123", email: "jan@example.com" };
    const result = redactObject(input) as Record<string, unknown>;
    expect(result["name"]).toBe("Jan");
    expect(result["password"]).toBe("[REDACTED]");
  });

  it("redacts email addresses in string values", () => {
    const input = { note: "Contact john@example.com for info" };
    const result = redactObject(input) as Record<string, unknown>;
    expect(result["note"]).toBe("Contact [EMAIL_REDACTED] for info");
  });

  it("redacts nested PII fields", () => {
    const input = { user: { name: "Jan", api_key: "xyz" } };
    const result = redactObject(input) as Record<string, unknown>;
    expect((result["user"] as Record<string, unknown>)["api_key"]).toBe("[REDACTED]");
    expect((result["user"] as Record<string, unknown>)["name"]).toBe("Jan");
  });

  it("redacts PII in arrays", () => {
    const input = { users: [{ token: "abc" }, { token: "def" }] };
    const result = redactObject(input) as Record<string, unknown>;
    const users = result["users"] as Record<string, unknown>[];
    expect(users[0]!["token"]).toBe("[REDACTED]");
    expect(users[1]!["token"]).toBe("[REDACTED]");
  });

  it("handles null and undefined", () => {
    expect(redactObject(null)).toBeNull();
    expect(redactObject(undefined)).toBeUndefined();
  });

  it("handles primitive values", () => {
    expect(redactObject(42)).toBe(42);
    expect(redactObject(true)).toBe(true);
  });

  it("redacts authorization and session fields", () => {
    const input = { authorization: "Bearer xyz", session_id: "abc" };
    const result = redactObject(input) as Record<string, unknown>;
    expect(result["authorization"]).toBe("[REDACTED]");
    expect(result["session_id"]).toBe("[REDACTED]");
  });
});

describe("withTiming", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns the result of the function", async () => {
    const log = new Logger();
    const result = await withTiming(log, "test op", async () => 42);
    expect(result).toBe(42);
  });

  it("rethrows errors from the function", async () => {
    const log = new Logger();
    await expect(
      withTiming(log, "failing op", async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
  });

  it("logs slow operations as warnings", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const log = new Logger();

    vi.useFakeTimers();
    const promise = withTiming(log, "slow query", async () => {
      // Simulate slow operation
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      return "done";
    });
    vi.advanceTimersByTime(600);
    await promise;
    vi.useRealTimers();

    expect(warnSpy).toHaveBeenCalled();
    const output = warnSpy.mock.calls[0]![0] as string;
    expect(output).toContain("slow");
  });
});
