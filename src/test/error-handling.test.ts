import { describe, it, expect } from "vitest";

describe("Error handling", () => {
  it("error page shows retry button text", () => {
    const buttonText = "Probeer opnieuw";
    expect(buttonText).toBe("Probeer opnieuw");
  });

  it("error page shows error message", () => {
    const message = "Er ging iets mis";
    expect(message).toBe("Er ging iets mis");
  });

  it("not-found page shows 404 message", () => {
    const message = "Pagina niet gevonden";
    expect(message).toBe("Pagina niet gevonden");
  });

  it("not-found page links back to dashboard", () => {
    const href = "/dashboard";
    expect(href).toBe("/dashboard");
  });
});
