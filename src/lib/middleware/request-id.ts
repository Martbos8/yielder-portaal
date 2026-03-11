/**
 * Generate a unique request ID for tracing across the request lifecycle.
 * Uses crypto.randomUUID() which is available in Edge Runtime.
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}
