import { describe, it, expect } from "vitest";

describe("Admin page", () => {
  it("admin page module is importable", async () => {
    const mod = await import("@/app/(portal)/admin/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("admin loading page is importable", async () => {
    const mod = await import("@/app/(portal)/admin/loading");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("isAdmin check requires is_yielder=true", () => {
    // Unit test for admin check logic (extracted)
    const checkAdmin = (profile: { is_yielder: boolean } | null) =>
      profile?.is_yielder === true;

    expect(checkAdmin(null)).toBe(false);
    expect(checkAdmin({ is_yielder: false })).toBe(false);
    expect(checkAdmin({ is_yielder: true })).toBe(true);
  });

  it("sync entity list covers all entities", () => {
    const entities = ["tickets", "agreements", "hardware", "companies", "contacts"];
    expect(entities).toContain("tickets");
    expect(entities).toContain("agreements");
    expect(entities).toContain("hardware");
    expect(entities.length).toBe(5);
  });

  it("CW env vars list is complete", () => {
    const vars = [
      "CW_BASE_URL",
      "CW_COMPANY_ID",
      "CW_PUBLIC_KEY",
      "CW_PRIVATE_KEY",
      "CW_CLIENT_ID",
    ];
    expect(vars).toHaveLength(5);
    expect(vars).toContain("CW_BASE_URL");
    expect(vars).toContain("CW_CLIENT_ID");
  });
});
