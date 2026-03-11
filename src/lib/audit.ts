// Centralized audit logging utility
// Writes to the audit_log table in Supabase

type AuditDetails = Record<string, unknown>;

/**
 * Log an audit event. Works in both server and client contexts.
 * Strips PII from details before logging.
 */
export async function logAudit(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: AuditDetails
) {
  try {
    const sanitizedDetails = details ? stripPii(details) : undefined;

    // Dynamic import to work in both server and client contexts
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    await supabase.from("audit_log").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: sanitizedDetails ?? null,
    });
  } catch {
    // Silently fail — audit logging should never break the application
  }
}

/**
 * PII field names to strip from audit log details.
 */
const PII_FIELDS = new Set([
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
]);

/**
 * Strip PII fields from details object.
 * Replaces values of sensitive keys with "[REDACTED]".
 */
export function stripPii(details: AuditDetails): AuditDetails {
  const result: AuditDetails = {};

  for (const [key, value] of Object.entries(details)) {
    if (PII_FIELDS.has(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = stripPii(value as AuditDetails);
    } else {
      result[key] = value;
    }
  }

  return result;
}
