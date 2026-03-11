import { describe, it, expect } from "vitest";
import { escapeHtml, formatDate, formatCurrency } from "@/lib/utils";

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
    );
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("leaves safe strings unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });
});

describe("formatDate", () => {
  it("formats date in Dutch locale", () => {
    const result = formatDate("2026-03-12");
    expect(result).toContain("2026");
    expect(result).toContain("12");
  });

  it("returns em dash for null", () => {
    expect(formatDate(null)).toBe("—");
  });
});

describe("formatCurrency", () => {
  it("formats amounts in EUR", () => {
    const result = formatCurrency(1234.56);
    expect(result).toMatch(/(?:EUR|€)\s?1[.,]234[.,]56/);
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/(?:EUR|€)\s?0[.,]00/);
  });

  it("returns em dash for null", () => {
    expect(formatCurrency(null)).toBe("—");
  });
});
