/**
 * Structured logging module for the Yielder portal.
 *
 * - JSON format in production (for log aggregation)
 * - Pretty-printed in development
 * - Automatic PII redaction
 * - Context: requestId, userId, companyId, route
 * - Log levels: debug, info, warn, error
 */

// --- Types ---

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  userId?: string;
  companyId?: string;
  route?: string;
  service?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  durationMs?: number;
}

// --- PII Redaction ---

const PII_PATTERNS = [
  "password",
  "wachtwoord",
  "token",
  "secret",
  "credit_card",
  "creditcard",
  "bsn",
  "ssn",
  "iban",
  "bank_account",
  "authorization",
  "cookie",
  "session",
  "api_key",
  "apikey",
] as const;

function containsPiiKey(key: string): boolean {
  const lower = key.toLowerCase();
  for (const pattern of PII_PATTERNS) {
    if (lower.includes(pattern)) return true;
  }
  return false;
}

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    // Redact email addresses
    return value.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[EMAIL_REDACTED]"
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactObject(item));
  }

  if (typeof value === "object") {
    return redactObject(value as Record<string, unknown>);
  }

  return value;
}

/** Recursively redact PII from an object */
export function redactObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return redactValue(obj);
  if (Array.isArray(obj)) return obj.map((item) => redactObject(item));

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (containsPiiKey(key)) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = redactObject(value);
    }
  }
  return result;
}

// --- Log Level Ordering ---

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const env = process.env["NODE_ENV"];
  if (env === "production") return "info";
  if (env === "test") return "warn";
  return "debug";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[getMinLevel()];
}

// --- Formatting ---

const isDev = () => process.env["NODE_ENV"] !== "production" && process.env["NODE_ENV"] !== "test";

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m",  // green
  warn: "\x1b[33m",  // yellow
  error: "\x1b[31m", // red
};

const RESET = "\x1b[0m";

function formatDev(entry: LogEntry): string {
  const color = LEVEL_COLORS[entry.level];
  const level = entry.level.toUpperCase().padEnd(5);
  const ctx = entry.context
    ? ` ${Object.entries(entry.context)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(" ")}`
    : "";
  const duration = entry.durationMs !== undefined ? ` (${entry.durationMs}ms)` : "";
  const errorInfo = entry.error ? `\n  ${entry.error.name}: ${entry.error.message}` : "";
  const stack = entry.error?.stack ? `\n  ${entry.error.stack}` : "";

  return `${color}[${level}]${RESET} ${entry.message}${ctx}${duration}${errorInfo}${stack}`;
}

function formatJson(entry: LogEntry): string {
  const redacted = redactObject(entry) as LogEntry;
  return JSON.stringify(redacted);
}

function formatEntry(entry: LogEntry): string {
  return isDev() ? formatDev(entry) : formatJson(entry);
}

// --- Output ---

function output(level: LogLevel, formatted: string): void {
  switch (level) {
    case "debug":
    case "info":
      // eslint-disable-next-line no-console
      console.info(formatted);
      break;
    case "warn":
      // eslint-disable-next-line no-console
      console.warn(formatted);
      break;
    case "error":
      // eslint-disable-next-line no-console
      console.error(formatted);
      break;
  }
}

// --- Logger Class ---

export class Logger {
  private readonly defaultContext: LogContext;

  constructor(context: LogContext = {}) {
    this.defaultContext = context;
  }

  /** Create a child logger with additional context */
  child(context: LogContext): Logger {
    return new Logger({ ...this.defaultContext, ...context });
  }

  private log(level: LogLevel, message: string, extra?: LogContext & { error?: unknown; durationMs?: number }): void {
    if (!shouldLog(level)) return;

    const { error, durationMs, ...extraContext } = extra ?? {};
    const mergedContext = { ...this.defaultContext, ...extraContext };
    const hasContext = Object.values(mergedContext).some((v) => v !== undefined);

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: hasContext ? mergedContext : undefined,
      durationMs,
    };

    if (error) {
      if (error instanceof Error) {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: "code" in error ? String((error as { code: unknown }).code) : undefined,
        };
      } else {
        entry.error = {
          name: "Unknown",
          message: String(error),
        };
      }
    }

    output(level, formatEntry(entry));
  }

  debug(message: string, extra?: LogContext & { durationMs?: number }): void {
    this.log("debug", message, extra);
  }

  info(message: string, extra?: LogContext & { durationMs?: number }): void {
    this.log("info", message, extra);
  }

  warn(message: string, extra?: LogContext & { error?: unknown; durationMs?: number }): void {
    this.log("warn", message, extra);
  }

  error(message: string, extra?: LogContext & { error?: unknown; durationMs?: number }): void {
    this.log("error", message, extra);
  }
}

// --- Singleton + Factories ---

/** Root logger instance */
export const logger = new Logger();

/** Create a logger scoped to a service/module */
export function createLogger(service: string, context?: LogContext): Logger {
  return new Logger({ service, ...context });
}

// --- Performance helper ---

/** Measure and log execution time of an async function */
export async function withTiming<T>(
  log: Logger,
  message: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    if (durationMs > 500) {
      log.warn(`${message} (slow)`, { ...context, durationMs });
    } else {
      log.debug(message, { ...context, durationMs });
    }
    return result;
  } catch (error) {
    const durationMs = Date.now() - start;
    log.error(`${message} failed`, { ...context, error, durationMs });
    throw error;
  }
}
