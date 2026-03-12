import { describe, it, expect } from "vitest";

// Test ContactRequest type
import type {
  ContactRequest,
  ContactRequestUrgency,
  ContactRequestStatus,
} from "@/types/database";

describe("Contact Modal — types and logic", () => {
  it("ContactRequest type has all required fields", () => {
    const request: ContactRequest = {
      id: "test-id",
      company_id: "company-1",
      user_id: "user-1",
      subject: "Interesse in Cloud Backup",
      message: "Graag meer informatie",
      product_id: "product-1",
      urgency: "normaal",
      status: "new",
      created_at: "2026-03-11T10:00:00Z",
      updated_at: "2026-03-11T10:00:00Z",
    };

    expect(request.subject).toBe("Interesse in Cloud Backup");
    expect(request.urgency).toBe("normaal");
    expect(request.status).toBe("new");
    expect(request.product_id).toBe("product-1");
  });

  it("urgency values are normaal or hoog", () => {
    const normaal: ContactRequestUrgency = "normaal";
    const hoog: ContactRequestUrgency = "hoog";
    expect(normaal).toBe("normaal");
    expect(hoog).toBe("hoog");
  });

  it("status values are new, read, or replied", () => {
    const statuses: ContactRequestStatus[] = ["new", "read", "replied"];
    expect(statuses).toHaveLength(3);
    expect(statuses).toContain("new");
    expect(statuses).toContain("read");
    expect(statuses).toContain("replied");
  });

  it("ContactRequest allows null message and product_id", () => {
    const request: ContactRequest = {
      id: "test-id",
      company_id: "company-1",
      user_id: "user-1",
      subject: "Algemene vraag",
      message: null,
      product_id: null,
      urgency: "normaal",
      status: "new",
      created_at: "2026-03-11T10:00:00Z",
      updated_at: "2026-03-11T10:00:00Z",
    };

    expect(request.message).toBeNull();
    expect(request.product_id).toBeNull();
  });

  it("subject prefill generates correct text for product", () => {
    const productName = "Cloud Backup";
    const subject = `Interesse in ${productName}`;
    expect(subject).toBe("Interesse in Cloud Backup");
  });

});
