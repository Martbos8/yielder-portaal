import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeSubject, sanitizeMessage } from "@/lib/sanitize";

describe("sanitize", () => {
  describe("sanitizeText", () => {
    it("strips HTML tags", () => {
      expect(sanitizeText("<b>bold</b>")).toBe("bold");
      expect(sanitizeText('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeText("<img src=x onerror=alert(1)>")).toBe("");
    });

    it("decodes HTML entities", () => {
      expect(sanitizeText("&lt;div&gt;")).toBe("<div>");
      expect(sanitizeText("Tom &amp; Jerry")).toBe("Tom & Jerry");
    });

    it("trims whitespace", () => {
      expect(sanitizeText("  hello  ")).toBe("hello");
      expect(sanitizeText("\n\ttext\n")).toBe("text");
    });

    it("preserves normal text", () => {
      expect(sanitizeText("Gewone tekst 123")).toBe("Gewone tekst 123");
    });

    it("handles empty string", () => {
      expect(sanitizeText("")).toBe("");
    });

    it("handles nested tags", () => {
      expect(sanitizeText("<div><p>text</p></div>")).toBe("text");
    });

    it("handles special characters", () => {
      expect(sanitizeText("Prijs: €100,00")).toBe("Prijs: €100,00");
      expect(sanitizeText("Café résumé")).toBe("Café résumé");
    });

    it("handles unicode", () => {
      expect(sanitizeText("日本語テスト")).toBe("日本語テスト");
      expect(sanitizeText("🎉 Party")).toBe("🎉 Party");
    });
  });

  describe("sanitizeSubject", () => {
    it("strips HTML and limits to 200 chars", () => {
      expect(sanitizeSubject("<b>Test</b>")).toBe("Test");
      expect(sanitizeSubject("a".repeat(300))).toHaveLength(200);
    });

    it("respects custom maxLength", () => {
      expect(sanitizeSubject("Hello World", 5)).toBe("Hello");
    });

    it("handles exactly maxLength", () => {
      expect(sanitizeSubject("exact", 5)).toBe("exact");
    });
  });

  describe("sanitizeMessage", () => {
    it("strips HTML and limits to 2000 chars", () => {
      expect(sanitizeMessage("<p>message</p>")).toBe("message");
      expect(sanitizeMessage("a".repeat(3000))).toHaveLength(2000);
    });

    it("respects custom maxLength", () => {
      expect(sanitizeMessage("Long message", 4)).toBe("Long");
    });
  });

  describe("Edge cases — XSS payloads", () => {
    it("neutralizes script injection", () => {
      const payloads = [
        '<script>document.cookie</script>',
        '<img src=x onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '<a href="javascript:alert(1)">click</a>',
        '"><script>alert(1)</script>',
      ];
      for (const payload of payloads) {
        const result = sanitizeText(payload);
        expect(result).not.toContain("<script");
        expect(result).not.toContain("<img");
        expect(result).not.toContain("<svg");
        expect(result).not.toContain("<a ");
      }
    });

    it("handles SQL injection strings safely (pass-through, no HTML)", () => {
      const sql = "'; DROP TABLE users; --";
      expect(sanitizeText(sql)).toBe("'; DROP TABLE users; --");
    });
  });
});
