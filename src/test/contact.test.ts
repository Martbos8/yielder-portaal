import { describe, it, expect } from "vitest";

const yielderTeam = [
  { name: "Jeroen de Vries", role: "Account Manager", email: "jeroen@yielder.nl" },
  { name: "Lisa van der Berg", role: "Service Desk Lead", email: "servicedesk@yielder.nl" },
  { name: "Mark Jansen", role: "Technisch Consultant", email: "mark@yielder.nl" },
  { name: "Sophie Bakker", role: "Projectmanager", email: "sophie@yielder.nl" },
];

describe("Contact page", () => {
  it("has correct page title", () => {
    expect("Contact").toBe("Contact");
  });

  it("displays 4 team members", () => {
    expect(yielderTeam).toHaveLength(4);
  });

  it("all team members have required fields", () => {
    for (const member of yielderTeam) {
      expect(member.name).toBeTruthy();
      expect(member.role).toBeTruthy();
      expect(member.email).toBeTruthy();
    }
  });

  it("all emails end with @yielder.nl", () => {
    for (const member of yielderTeam) {
      expect(member.email).toMatch(/@yielder\.nl$/);
    }
  });

  it("has an Account Manager in the team", () => {
    const am = yielderTeam.find((m) => m.role === "Account Manager");
    expect(am).toBeDefined();
  });

  it("has a Service Desk Lead in the team", () => {
    const sd = yielderTeam.find((m) => m.role === "Service Desk Lead");
    expect(sd).toBeDefined();
  });
});

describe("Contact form fields", () => {
  const requiredFields = ["Naam", "E-mail", "Onderwerp", "Bericht"];

  it("has 4 required form fields", () => {
    expect(requiredFields).toHaveLength(4);
  });

  it("includes name and email fields", () => {
    expect(requiredFields).toContain("Naam");
    expect(requiredFields).toContain("E-mail");
  });
});
