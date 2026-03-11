import { describe, it, expect } from "vitest";

describe("Realtime hooks", () => {
  it("useRealtime hook is exportable", async () => {
    const mod = await import("@/hooks/use-realtime");
    expect(mod.useRealtime).toBeDefined();
    expect(typeof mod.useRealtime).toBe("function");
  });

  it("useTicketRealtime hook is exportable", async () => {
    const mod = await import("@/hooks/use-realtime");
    expect(mod.useTicketRealtime).toBeDefined();
    expect(typeof mod.useTicketRealtime).toBe("function");
  });

  it("useAgreementRealtime hook is exportable", async () => {
    const mod = await import("@/hooks/use-realtime");
    expect(mod.useAgreementRealtime).toBeDefined();
    expect(typeof mod.useAgreementRealtime).toBe("function");
  });

  it("useHardwareRealtime hook is exportable", async () => {
    const mod = await import("@/hooks/use-realtime");
    expect(mod.useHardwareRealtime).toBeDefined();
    expect(typeof mod.useHardwareRealtime).toBe("function");
  });
});
