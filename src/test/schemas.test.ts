import { describe, it, expect } from "vitest";
import {
  UUIDSchema,
  PaginationSchema,
  DateRangeSchema,
  SortDirectionSchema,
  createSortSchema,
  ContactRequestSchema,
  FeedbackSchema,
  MarkAsReadSchema,
  MarkAllAsReadSchema,
  TicketFilterSchema,
  SyncRequestSchema,
} from "@/lib/schemas";

// ── Common Schemas ──────────────────────────────────────────────

describe("UUIDSchema", () => {
  it("accepts valid UUID", () => {
    const result = UUIDSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = UUIDSchema.safeParse("not-a-uuid");
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = UUIDSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("PaginationSchema", () => {
  it("applies defaults", () => {
    const result = PaginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(0);
      expect(result.data.pageSize).toBe(25);
    }
  });

  it("accepts valid values", () => {
    const result = PaginationSchema.safeParse({ page: 2, pageSize: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(50);
    }
  });

  it("rejects pageSize > 100", () => {
    const result = PaginationSchema.safeParse({ pageSize: 200 });
    expect(result.success).toBe(false);
  });

  it("rejects negative page", () => {
    const result = PaginationSchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });

  it("coerces string values", () => {
    const result = PaginationSchema.safeParse({ page: "3", pageSize: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.pageSize).toBe(10);
    }
  });
});

describe("DateRangeSchema", () => {
  it("accepts valid range", () => {
    const result = DateRangeSchema.safeParse({
      from: "2026-01-01",
      to: "2026-12-31",
    });
    expect(result.success).toBe(true);
  });

  it("rejects reversed range", () => {
    const result = DateRangeSchema.safeParse({
      from: "2026-12-31",
      to: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts same date", () => {
    const result = DateRangeSchema.safeParse({
      from: "2026-06-15",
      to: "2026-06-15",
    });
    expect(result.success).toBe(true);
  });
});

describe("SortDirectionSchema", () => {
  it("defaults to asc", () => {
    const result = SortDirectionSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("asc");
  });

  it("accepts desc", () => {
    const result = SortDirectionSchema.safeParse("desc");
    expect(result.success).toBe(true);
  });

  it("rejects invalid direction", () => {
    const result = SortDirectionSchema.safeParse("up");
    expect(result.success).toBe(false);
  });
});

describe("createSortSchema", () => {
  const TestSort = createSortSchema(["name", "date"] as const);

  it("accepts valid sort field", () => {
    const result = TestSort.safeParse({ sortBy: "name", sortDirection: "desc" });
    expect(result.success).toBe(true);
  });

  it("rejects unknown sort field", () => {
    const result = TestSort.safeParse({ sortBy: "unknown" });
    expect(result.success).toBe(false);
  });

  it("sort field is optional", () => {
    const result = TestSort.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ── Contact Schema ──────────────────────────────────────────────

describe("ContactRequestSchema", () => {
  const validInput = {
    companyId: "550e8400-e29b-41d4-a716-446655440000",
    subject: "Test onderwerp",
  };

  it("accepts minimal valid input", () => {
    const result = ContactRequestSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.urgency).toBe("normaal");
    }
  });

  it("accepts full input", () => {
    const result = ContactRequestSchema.safeParse({
      ...validInput,
      message: "Dit is een bericht",
      productId: "660e8400-e29b-41d4-a716-446655440000",
      urgency: "hoog",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty subject", () => {
    const result = ContactRequestSchema.safeParse({ ...validInput, subject: "" });
    expect(result.success).toBe(false);
  });

  it("rejects subject > 200 chars", () => {
    const result = ContactRequestSchema.safeParse({
      ...validInput,
      subject: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects message > 2000 chars", () => {
    const result = ContactRequestSchema.safeParse({
      ...validInput,
      message: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid urgency", () => {
    const result = ContactRequestSchema.safeParse({
      ...validInput,
      urgency: "kritiek",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid companyId", () => {
    const result = ContactRequestSchema.safeParse({
      ...validInput,
      companyId: "not-uuid",
    });
    expect(result.success).toBe(false);
  });
});

// ── Feedback Schema ─────────────────────────────────────────────

describe("FeedbackSchema", () => {
  const validInput = {
    companyId: "550e8400-e29b-41d4-a716-446655440000",
    productId: "660e8400-e29b-41d4-a716-446655440000",
    action: "clicked" as const,
  };

  it("accepts valid input with defaults", () => {
    const result = FeedbackSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recommendationScore).toBe(0);
    }
  });

  it("accepts all valid actions", () => {
    for (const action of ["shown", "clicked", "contacted", "purchased", "dismissed"]) {
      const result = FeedbackSchema.safeParse({ ...validInput, action });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid action", () => {
    const result = FeedbackSchema.safeParse({ ...validInput, action: "liked" });
    expect(result.success).toBe(false);
  });

  it("rejects score > 100", () => {
    const result = FeedbackSchema.safeParse({
      ...validInput,
      recommendationScore: 150,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative score", () => {
    const result = FeedbackSchema.safeParse({
      ...validInput,
      recommendationScore: -1,
    });
    expect(result.success).toBe(false);
  });
});

// ── Notification Schemas ────────────────────────────────────────

describe("MarkAsReadSchema", () => {
  it("accepts valid UUID", () => {
    const result = MarkAsReadSchema.safeParse({
      notificationId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing notificationId", () => {
    const result = MarkAsReadSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("MarkAllAsReadSchema", () => {
  it("accepts valid array", () => {
    const result = MarkAllAsReadSchema.safeParse({
      notificationIds: ["550e8400-e29b-41d4-a716-446655440000"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const result = MarkAllAsReadSchema.safeParse({ notificationIds: [] });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUIDs in array", () => {
    const result = MarkAllAsReadSchema.safeParse({
      notificationIds: ["not-uuid"],
    });
    expect(result.success).toBe(false);
  });
});

// ── Ticket Filter Schema ───────────────────────────────────────

describe("TicketFilterSchema", () => {
  it("accepts empty filter (all defaults)", () => {
    const result = TicketFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(0);
      expect(result.data.pageSize).toBe(25);
      expect(result.data.sortDirection).toBe("asc");
    }
  });

  it("accepts valid status filter", () => {
    const result = TicketFilterSchema.safeParse({ status: "Open" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = TicketFilterSchema.safeParse({ status: "Unknown" });
    expect(result.success).toBe(false);
  });

  it("accepts valid priority filter", () => {
    const result = TicketFilterSchema.safeParse({ priority: "urgent" });
    expect(result.success).toBe(true);
  });

  it("accepts search string", () => {
    const result = TicketFilterSchema.safeParse({ search: "printer" });
    expect(result.success).toBe(true);
  });

  it("rejects search > 200 chars", () => {
    const result = TicketFilterSchema.safeParse({ search: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("accepts sort by valid field", () => {
    const result = TicketFilterSchema.safeParse({
      sortBy: "priority",
      sortDirection: "desc",
    });
    expect(result.success).toBe(true);
  });
});

// ── Sync Schema ─────────────────────────────────────────────────

describe("SyncRequestSchema", () => {
  it("applies defaults", () => {
    const result = SyncRequestSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.entities).toEqual(["all"]);
      expect(result.data.force).toBe(false);
    }
  });

  it("accepts specific entities", () => {
    const result = SyncRequestSchema.safeParse({
      entities: ["tickets", "hardware"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid entity type", () => {
    const result = SyncRequestSchema.safeParse({
      entities: ["invalid"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty entities array", () => {
    const result = SyncRequestSchema.safeParse({ entities: [] });
    expect(result.success).toBe(false);
  });

  it("accepts force flag", () => {
    const result = SyncRequestSchema.safeParse({ force: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.force).toBe(true);
    }
  });
});
