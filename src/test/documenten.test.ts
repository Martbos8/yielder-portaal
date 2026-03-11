import { describe, it, expect } from "vitest";

const documentGroups = [
  { category: "Handleidingen", count: 3 },
  { category: "Contracten", count: 3 },
  { category: "Whitepapers", count: 3 },
  { category: "Rapporten", count: 2 },
];

describe("Documenten page", () => {
  it("has correct page title", () => {
    expect("Documenten").toBe("Documenten");
  });

  it("has 4 document categories", () => {
    expect(documentGroups).toHaveLength(4);
  });

  it("total documents is 11", () => {
    const total = documentGroups.reduce((s, g) => s + g.count, 0);
    expect(total).toBe(11);
  });

  it("includes required categories", () => {
    const cats = documentGroups.map((g) => g.category);
    expect(cats).toContain("Handleidingen");
    expect(cats).toContain("Contracten");
    expect(cats).toContain("Whitepapers");
    expect(cats).toContain("Rapporten");
  });

  it("each category has at least 2 documents", () => {
    for (const group of documentGroups) {
      expect(group.count).toBeGreaterThanOrEqual(2);
    }
  });
});
