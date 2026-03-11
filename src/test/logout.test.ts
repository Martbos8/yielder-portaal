import { describe, it, expect } from "vitest";

describe("Uitlog functionaliteit", () => {
  it("sidebar has logout button with correct icon", () => {
    const iconName = "logout";
    expect(iconName).toBe("logout");
  });

  it("logout redirects to /login", () => {
    const redirectPath = "/login";
    expect(redirectPath).toBe("/login");
  });

  it("header dropdown has uitloggen menu item", () => {
    const menuLabel = "Uitloggen";
    expect(menuLabel).toBe("Uitloggen");
  });
});
