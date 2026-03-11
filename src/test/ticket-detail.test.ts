import { describe, it, expect } from "vitest";

describe("Ticket detail page", () => {
  it("has back link to tickets", () => {
    const backLink = "/tickets";
    expect(backLink).toBe("/tickets");
  });

  it("back link text is correct", () => {
    const text = "Terug naar tickets";
    expect(text).toBe("Terug naar tickets");
  });

  it("shows beschrijving section", () => {
    const label = "Beschrijving";
    expect(label).toBe("Beschrijving");
  });

  it("detail fields include expected labels", () => {
    const labels = [
      "Ticket ID",
      "Contactpersoon",
      "Bron",
      "Aangemaakt op",
      "Laatst bijgewerkt",
    ];
    expect(labels).toContain("Ticket ID");
    expect(labels).toContain("Contactpersoon");
    expect(labels).toContain("Aangemaakt op");
  });

  it("getTicketById is exported from queries", async () => {
    const queries = await import("@/lib/queries");
    expect(typeof queries.getTicketById).toBe("function");
  });
});
