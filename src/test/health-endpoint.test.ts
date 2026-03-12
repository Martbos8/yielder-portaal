import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @supabase/supabase-js before importing the route
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(() => ({
      maybeSingle: vi.fn(() => Promise.resolve({ data: "PostgreSQL 15.1", error: null })),
    })),
  })),
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");
  });

  it("returns ok status with expected fields", async () => {
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.1.0");
    expect(body.timestamp).toBeDefined();
    expect(body.database).toBe("connected");
  });

  it("returns valid ISO timestamp", async () => {
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    const parsed = new Date(body.timestamp);
    expect(parsed.toISOString()).toBe(body.timestamp);
  });

  it("returns disconnected when supabase env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    // Re-import to get fresh module
    vi.resetModules();
    vi.doMock("@supabase/supabase-js", () => ({
      createClient: vi.fn(),
    }));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(body.database).toBe("disconnected");
  });
});
