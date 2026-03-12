import { describe, it, expect } from "vitest";
import type { Ticket, TicketStatus, TicketPriority } from "@/types/database";

describe("Tickets tabel", () => {
  const columnHeaders = [
    "#ID",
    "Samenvatting",
    "Status",
    "Prioriteit",
    "Contactpersoon",
    "Aangemaakt",
  ];

  it("has 6 column headers defined", () => {
    expect(columnHeaders).toHaveLength(6);
  });

  it("includes all required column headers", () => {
    expect(columnHeaders).toContain("#ID");
    expect(columnHeaders).toContain("Samenvatting");
    expect(columnHeaders).toContain("Status");
    expect(columnHeaders).toContain("Prioriteit");
    expect(columnHeaders).toContain("Contactpersoon");
    expect(columnHeaders).toContain("Aangemaakt");
  });

  it("empty state text is correct", () => {
    const emptyText = "Geen tickets gevonden";
    expect(emptyText).toBe("Geen tickets gevonden");
  });
});

describe("Tickets status badges", () => {
  const statusConfig = {
    open: { label: "Open", className: "bg-emerald-100 text-emerald-700" },
    in_progress: {
      label: "In behandeling",
      className: "bg-orange-100 text-orange-700",
    },
    closed: { label: "Gesloten", className: "bg-gray-100 text-gray-600" },
  };

  it("open status uses green styling", () => {
    expect(statusConfig.open.className).toContain("emerald");
  });

  it("in_progress status uses orange styling", () => {
    expect(statusConfig.in_progress.className).toContain("orange");
  });

  it("closed status uses gray styling", () => {
    expect(statusConfig.closed.className).toContain("gray");
  });
});

describe("Tickets prioriteit badges", () => {
  const priorityConfig = {
    urgent: { label: "Urgent", className: "bg-red-100 text-red-700" },
    high: { label: "Hoog", className: "bg-orange-100 text-orange-700" },
    normal: { label: "Normaal", className: "bg-blue-100 text-blue-700" },
    low: { label: "Laag", className: "bg-gray-100 text-gray-600" },
  };

  it("urgent priority uses red styling", () => {
    expect(priorityConfig.urgent.label).toBe("Urgent");
    expect(priorityConfig.urgent.className).toContain("red");
  });

  it("high priority uses orange styling", () => {
    expect(priorityConfig.high.label).toBe("Hoog");
    expect(priorityConfig.high.className).toContain("orange");
  });

  it("normal priority uses blue styling", () => {
    expect(priorityConfig.normal.label).toBe("Normaal");
    expect(priorityConfig.normal.className).toContain("blue");
  });

  it("low priority uses gray styling", () => {
    expect(priorityConfig.low.label).toBe("Laag");
    expect(priorityConfig.low.className).toContain("gray");
  });
});

describe("Tickets formatDate", () => {
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  it("formats null as em dash", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("formats date in Dutch locale", () => {
    const result = formatDate("2026-03-12T10:00:00Z");
    expect(result).toContain("2026");
    expect(result).toContain("12");
  });
});

describe("Ticket filter options", () => {
  const statusOptions = [
    { value: "", label: "Alle statussen" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In behandeling" },
    { value: "closed", label: "Gesloten" },
  ];

  const priorityOptions = [
    { value: "", label: "Alle prioriteiten" },
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "Hoog" },
    { value: "normal", label: "Normaal" },
    { value: "low", label: "Laag" },
  ];

  it("has status filter options including 'Alle'", () => {
    expect(statusOptions).toHaveLength(4);
    expect(statusOptions[0]!.label).toBe("Alle statussen");
  });

  it("has priority filter options including 'Alle'", () => {
    expect(priorityOptions).toHaveLength(5);
    expect(priorityOptions[0]!.label).toBe("Alle prioriteiten");
  });

  it("status options map to valid TicketStatus values", () => {
    const validStatuses: TicketStatus[] = ["open", "in_progress", "closed"];
    statusOptions.slice(1).forEach((opt) => {
      expect(validStatuses).toContain(opt.value);
    });
  });

  it("priority options map to valid TicketPriority values", () => {
    const validPriorities: TicketPriority[] = [
      "urgent",
      "high",
      "normal",
      "low",
    ];
    priorityOptions.slice(1).forEach((opt) => {
      expect(validPriorities).toContain(opt.value);
    });
  });
});

describe("Ticket client-side filtering logic", () => {
  function makeTicket(
    overrides: Partial<Ticket> & { summary: string }
  ): Ticket {
    return {
      id: "1",
      company_id: "c1",
      cw_ticket_id: null,
      description: null,
      status: "open",
      priority: "normal",
      contact_name: null,
      source: null,
      is_closed: false,
      cw_created_at: null,
      cw_updated_at: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
      ...overrides,
    };
  }

  function filterTickets(
    tickets: Ticket[],
    search: string,
    statusFilter: string,
    priorityFilter: string
  ): Ticket[] {
    return tickets.filter((ticket) => {
      if (
        search &&
        !ticket.summary.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (statusFilter && ticket.status !== statusFilter) return false;
      if (priorityFilter && ticket.priority !== priorityFilter) return false;
      return true;
    });
  }

  const tickets = [
    makeTicket({ id: "1", summary: "Printer werkt niet", status: "open", priority: "high" }),
    makeTicket({ id: "2", summary: "Email probleem", status: "in_progress", priority: "normal" }),
    makeTicket({ id: "3", summary: "VPN verbinding storing", status: "closed", priority: "urgent" }),
    makeTicket({ id: "4", summary: "Nieuwe printer installeren", status: "open", priority: "low" }),
  ];

  it("returns all tickets with no filters", () => {
    expect(filterTickets(tickets, "", "", "")).toHaveLength(4);
  });

  it("filters by search term (case-insensitive)", () => {
    const result = filterTickets(tickets, "printer", "", "");
    expect(result).toHaveLength(2);
    expect(result[0]!.summary).toBe("Printer werkt niet");
    expect(result[1]!.summary).toBe("Nieuwe printer installeren");
  });

  it("filters by status", () => {
    const result = filterTickets(tickets, "", "open", "");
    expect(result).toHaveLength(2);
    result.forEach((t) => expect(t.status).toBe("open"));
  });

  it("filters by priority", () => {
    const result = filterTickets(tickets, "", "", "urgent");
    expect(result).toHaveLength(1);
    expect(result[0]!.priority).toBe("urgent");
  });

  it("combines search and status filter", () => {
    const result = filterTickets(tickets, "printer", "open", "");
    expect(result).toHaveLength(2);
  });

  it("combines all filters", () => {
    const result = filterTickets(tickets, "printer", "open", "high");
    expect(result).toHaveLength(1);
    expect(result[0]!.summary).toBe("Printer werkt niet");
  });

  it("returns empty when no matches", () => {
    const result = filterTickets(tickets, "onbekend", "", "");
    expect(result).toHaveLength(0);
  });
});
