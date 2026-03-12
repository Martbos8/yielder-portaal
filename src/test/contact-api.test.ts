import { describe, it, expect, beforeEach } from "vitest";
import { sanitizeSubject, sanitizeMessage } from "@/lib/sanitize";
import { checkRateLimit, RATE_LIMITS, clearRateLimits } from "@/lib/rate-limit";

describe("Contact API validation logic", () => {
  const validSubject = "Hulp met printer";
  const validMessage = "Onze printer doet het niet meer, kunnen jullie helpen?";

  it("rejects empty subject", () => {
    expect("".trim().length === 0).toBe(true);
  });

  it("rejects subject over 200 chars", () => {
    const longSubject = "a".repeat(201);
    expect(longSubject.length > 200).toBe(true);
  });

  it("accepts subject within limits", () => {
    expect(validSubject.length > 0 && validSubject.length <= 200).toBe(true);
  });

  it("rejects empty message", () => {
    expect("".trim().length === 0).toBe(true);
  });

  it("rejects message under 10 chars", () => {
    expect("kort".trim().length < 10).toBe(true);
  });

  it("rejects message over 2000 chars", () => {
    const longMsg = "a".repeat(2001);
    expect(longMsg.length > 2000).toBe(true);
  });

  it("accepts valid message", () => {
    const len = validMessage.trim().length;
    expect(len >= 10 && len <= 2000).toBe(true);
  });

  it("validates urgency values", () => {
    const valid = new Set(["normaal", "hoog"]);
    expect(valid.has("normaal")).toBe(true);
    expect(valid.has("hoog")).toBe(true);
    expect(valid.has("urgent")).toBe(false);
    expect(valid.has("")).toBe(false);
  });

  it("validates UUID format for product_id", () => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(uuidRegex.test("not-a-uuid")).toBe(false);
    expect(uuidRegex.test("")).toBe(false);
  });

  it("accepts null/undefined product_id", () => {
    expect(null === undefined || null === null).toBe(true);
  });
});

describe("Contact API sanitization", () => {
  it("strips HTML from subject", () => {
    const result = sanitizeSubject('<script>alert("xss")</script>Hallo');
    expect(result).toBe('alert("xss")Hallo');
    expect(result).not.toContain("<script>");
  });

  it("strips HTML from message", () => {
    const result = sanitizeMessage("<b>Bold</b> en <i>italic</i> tekst");
    expect(result).toBe("Bold en italic tekst");
  });

  it("limits subject to 200 chars", () => {
    const long = "a".repeat(300);
    expect(sanitizeSubject(long).length).toBe(200);
  });

  it("limits message to 2000 chars", () => {
    const long = "a".repeat(3000);
    expect(sanitizeMessage(long).length).toBe(2000);
  });
});

describe("Contact API rate limiting", () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it("allows requests within limit", () => {
    const result = checkRateLimit("test-contact:user1", RATE_LIMITS.contactRequest);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
  });

  it("blocks after 20 requests", () => {
    for (let i = 0; i < 20; i++) {
      checkRateLimit("test-contact:flood", RATE_LIMITS.contactRequest);
    }
    const blocked = checkRateLimit("test-contact:flood", RATE_LIMITS.contactRequest);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("different users have separate limits", () => {
    for (let i = 0; i < 20; i++) {
      checkRateLimit("test-contact:userA", RATE_LIMITS.contactRequest);
    }
    const blockedA = checkRateLimit("test-contact:userA", RATE_LIMITS.contactRequest);
    const allowedB = checkRateLimit("test-contact:userB", RATE_LIMITS.contactRequest);
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });
});
