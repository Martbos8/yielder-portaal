import { describe, it, expect } from "vitest";
import { ConnectWiseClient } from "@/lib/connectwise/client";
import { mapTicketStatus, mapPriority, mapAgreementStatus } from "@/lib/connectwise/sync";

describe("ConnectWise Client", () => {
  it("instantiates without errors", () => {
    const client = new ConnectWiseClient();
    expect(client).toBeDefined();
  });

  it("isConfigured returns false without env vars", () => {
    const client = new ConnectWiseClient();
    expect(client.isConfigured()).toBe(false);
  });

  it("get returns empty array when not configured", async () => {
    const client = new ConnectWiseClient();
    const result = await client.get("/service/tickets");
    expect(result).toEqual([]);
  });
});

describe("ConnectWise Sync — mapping functions", () => {
  describe("mapTicketStatus", () => {
    it("returns closed for closedFlag=true", () => {
      expect(mapTicketStatus("Open", true)).toBe("closed");
    });

    it("returns open for undefined status", () => {
      expect(mapTicketStatus(undefined, false)).toBe("open");
    });

    it("returns in_progress for progress status", () => {
      expect(mapTicketStatus("In Progress", false)).toBe("in_progress");
    });

    it("returns closed for Resolved status", () => {
      expect(mapTicketStatus("Resolved", false)).toBe("closed");
    });

    it("returns open for unknown status", () => {
      expect(mapTicketStatus("New", false)).toBe("open");
    });
  });

  describe("mapPriority", () => {
    it("returns urgent for critical priority", () => {
      expect(mapPriority("Critical")).toBe("urgent");
    });

    it("returns high for High priority", () => {
      expect(mapPriority("High")).toBe("high");
    });

    it("returns low for Low priority", () => {
      expect(mapPriority("Low")).toBe("low");
    });

    it("returns normal for undefined", () => {
      expect(mapPriority(undefined)).toBe("normal");
    });

    it("returns normal for unknown priority", () => {
      expect(mapPriority("Medium")).toBe("normal");
    });
  });

  describe("mapAgreementStatus", () => {
    it("returns cancelled for cancelledFlag=true", () => {
      expect(mapAgreementStatus(true, undefined)).toBe("cancelled");
    });

    it("returns expired for past end date", () => {
      expect(mapAgreementStatus(false, "2020-01-01")).toBe("expired");
    });

    it("returns active for future end date", () => {
      expect(mapAgreementStatus(false, "2030-12-31")).toBe("active");
    });

    it("returns active when no end date", () => {
      expect(mapAgreementStatus(false, undefined)).toBe("active");
    });
  });
});

describe("ConnectWise module exports", () => {
  it("syncAll is exportable", async () => {
    const mod = await import("@/lib/connectwise/sync");
    expect(typeof mod.syncAll).toBe("function");
  });

  it("types are importable", async () => {
    const mod = await import("@/lib/connectwise/types");
    expect(mod).toBeDefined();
  });
});
