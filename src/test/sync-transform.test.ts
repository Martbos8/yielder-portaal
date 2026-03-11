import { describe, it, expect } from "vitest";
import {
  transformCompany,
  transformTicket,
  transformAgreement,
  transformHardware,
  mapTicketStatus,
  mapPriority,
  mapAgreementStatus,
  mapHardwareType,
} from "@/lib/sync/transform";
import type { TransformContext } from "@/lib/sync/types";
import { DEFAULT_SYNC_CONFIGS } from "@/lib/sync/types";
import type { CWTicket, CWAgreement, CWConfiguration, CWCompany } from "@/lib/connectwise/types";

const context: TransformContext = {
  companyIdMap: new Map([[100, "uuid-company-1"]]),
  syncTimestamp: "2026-03-11T12:00:00Z",
};

describe("mapTicketStatus", () => {
  it("returns closed for closedFlag", () => {
    expect(mapTicketStatus("Open", true)).toBe("closed");
  });

  it("returns open for no status", () => {
    expect(mapTicketStatus(undefined, false)).toBe("open");
  });

  it("returns in_progress for status with progress", () => {
    expect(mapTicketStatus("In Progress", false)).toBe("in_progress");
  });

  it("returns closed for resolved", () => {
    expect(mapTicketStatus("Resolved", false)).toBe("closed");
  });
});

describe("mapPriority", () => {
  it("returns normal for undefined", () => {
    expect(mapPriority(undefined)).toBe("normal");
  });

  it("returns urgent for critical", () => {
    expect(mapPriority("Critical")).toBe("urgent");
  });

  it("returns high for high", () => {
    expect(mapPriority("High")).toBe("high");
  });

  it("returns low for low", () => {
    expect(mapPriority("Low")).toBe("low");
  });
});

describe("mapAgreementStatus", () => {
  it("returns cancelled when cancelled", () => {
    expect(mapAgreementStatus(true)).toBe("cancelled");
  });

  it("returns expired for past end date", () => {
    expect(mapAgreementStatus(false, "2020-01-01")).toBe("expired");
  });

  it("returns active for valid agreement", () => {
    expect(mapAgreementStatus(false, "2030-01-01")).toBe("active");
  });
});

describe("mapHardwareType", () => {
  it("returns Laptop for laptop type", () => {
    expect(mapHardwareType("Laptop")).toBe("Laptop");
  });

  it("returns Desktop for workstation", () => {
    expect(mapHardwareType("Workstation")).toBe("Desktop");
  });

  it("returns Server for server type", () => {
    expect(mapHardwareType("Server")).toBe("Server");
  });

  it("returns Netwerk for firewall", () => {
    expect(mapHardwareType("Firewall")).toBe("Netwerk");
  });

  it("returns Overig for unknown type", () => {
    expect(mapHardwareType("Printer")).toBe("Overig");
  });

  it("returns Overig for undefined", () => {
    expect(mapHardwareType(undefined)).toBe("Overig");
  });
});

describe("transformCompany", () => {
  it("transforms CW company to upsert shape", () => {
    const cw: CWCompany = {
      id: 100,
      identifier: "acme",
      name: "Acme Corp",
      status: { id: 1, name: "Active" },
      numberOfEmployees: 50,
      market: { id: 1, name: "Technology" },
    };
    const result = transformCompany(cw, context);
    expect(result).toEqual({
      cw_company_id: 100,
      name: "Acme Corp",
      employee_count: 50,
      industry: "Technology",
    });
  });
});

describe("transformTicket", () => {
  it("transforms CW ticket with valid company mapping", () => {
    const cw: CWTicket = {
      id: 500,
      summary: "Server down",
      company: { id: 100, identifier: "acme", name: "Acme Corp" },
      status: { id: 1, name: "In Progress" },
      priority: { id: 1, name: "High" },
      contact: { id: 1, name: "Jan de Vries" },
      source: { id: 1, name: "Email" },
      closedFlag: false,
      _info: { dateEntered: "2026-03-01T10:00:00Z", lastUpdated: "2026-03-10T15:00:00Z" },
    };
    const result = transformTicket(cw, context);
    expect(result).not.toBeNull();
    expect(result!.company_id).toBe("uuid-company-1");
    expect(result!.status).toBe("in_progress");
    expect(result!.priority).toBe("high");
  });

  it("returns null for unknown company", () => {
    const cw: CWTicket = {
      id: 501,
      summary: "Test",
      company: { id: 999, identifier: "unknown", name: "Unknown" },
      closedFlag: false,
    };
    expect(transformTicket(cw, context)).toBeNull();
  });

  it("returns null for missing company", () => {
    const cw: CWTicket = {
      id: 502,
      summary: "Test",
      closedFlag: false,
    };
    expect(transformTicket(cw, context)).toBeNull();
  });
});

describe("transformAgreement", () => {
  it("transforms CW agreement with valid mapping", () => {
    const cw: CWAgreement = {
      id: 200,
      name: "Managed Services",
      type: { id: 1, name: "Recurring" },
      company: { id: 100, identifier: "acme", name: "Acme Corp" },
      billAmount: 1500,
      startDate: "2025-01-01",
      endDate: "2026-12-31",
      cancelledFlag: false,
      noEndingDateFlag: false,
    };
    const result = transformAgreement(cw, context);
    expect(result).not.toBeNull();
    expect(result!.bill_amount).toBe(1500);
    expect(result!.status).toBe("active");
  });
});

describe("transformHardware", () => {
  it("transforms CW configuration with valid mapping", () => {
    const cw: CWConfiguration = {
      id: 300,
      name: "Dell Latitude 5550",
      type: { id: 1, name: "Laptop" },
      company: { id: 100, identifier: "acme", name: "Acme Corp" },
      manufacturer: { id: 1, name: "Dell" },
      model: "Latitude 5550",
      serialNumber: "SN12345",
      contact: { id: 1, name: "Jan de Vries" },
      warrantyExpirationDate: "2028-06-15",
    };
    const result = transformHardware(cw, context);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("Laptop");
    expect(result!.manufacturer).toBe("Dell");
    expect(result!.serial_number).toBe("SN12345");
  });
});

describe("DEFAULT_SYNC_CONFIGS", () => {
  it("has configs for all entity types", () => {
    expect(DEFAULT_SYNC_CONFIGS.companies.batchSize).toBe(100);
    expect(DEFAULT_SYNC_CONFIGS.tickets.batchSize).toBe(200);
    expect(DEFAULT_SYNC_CONFIGS.agreements.entityType).toBe("agreements");
    expect(DEFAULT_SYNC_CONFIGS.hardware.direction).toBe("pull");
    expect(DEFAULT_SYNC_CONFIGS.contacts.maxRetries).toBe(3);
    expect(DEFAULT_SYNC_CONFIGS.licenses.continueOnError).toBe(true);
  });
});
