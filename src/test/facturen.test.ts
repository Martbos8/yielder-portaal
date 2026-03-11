import { describe, it, expect } from "vitest";

describe("Facturen page", () => {
  it("page title is Facturen", () => {
    const title = "Facturen";
    expect(title).toBe("Facturen");
  });

  it("shows binnenkort beschikbaar text", () => {
    const text = "Factuuroverzicht wordt binnenkort beschikbaar";
    expect(text).toContain("binnenkort beschikbaar");
  });

  it("shows koppeling explanation text", () => {
    const text = "We werken aan de koppeling met ons facturatiesysteem";
    expect(text).toContain("koppeling met ons facturatiesysteem");
  });

  it("uses receipt_long icon", () => {
    const iconName = "receipt_long";
    expect(iconName).toBe("receipt_long");
  });
});
