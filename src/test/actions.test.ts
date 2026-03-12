import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthError, ValidationError, RateLimitError, DatabaseError } from "@/lib/errors";

// ---------- Mocks ----------

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 10, resetInMs: 60000, warning: false, limit: 20, resetAt: 0 }),
  RATE_LIMITS: {
    contactRequest: { maxRequests: 20, windowMs: 3600000 },
    magicLink: { maxRequests: 5, windowMs: 900000 },
    apiCall: { maxRequests: 100, windowMs: 60000 },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  }),
  withTiming: async (_log: unknown, _name: string, fn: () => Promise<unknown>) => fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const mockedCreateClient = vi.mocked(createClient);
const mockedCheckRateLimit = vi.mocked(checkRateLimit);

function createMockSupabase(authUser: { id: string } | null, insertError: { message: string } | null = null) {
  const chainMethods: Record<string, unknown> = {};
  chainMethods["insert"] = vi.fn().mockResolvedValue({ error: insertError });
  chainMethods["update"] = vi.fn().mockReturnValue(chainMethods);
  chainMethods["eq"] = vi.fn().mockReturnValue(chainMethods);
  chainMethods["in"] = vi.fn().mockReturnValue(chainMethods);

  // Make update chain resolve
  const updateProxy = new Proxy(chainMethods, {
    get(target, prop) {
      if (prop === "then") {
        return (resolve: (v: unknown) => void) => Promise.resolve({ error: insertError }).then(resolve);
      }
      return target[prop as string];
    },
  });

  const supabase = {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: insertError }),
      update: vi.fn().mockReturnValue(updateProxy),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: null,
      }),
    },
  };

  return supabase;
}

// Valid inputs for each action
const validContactInput = {
  companyId: "550e8400-e29b-41d4-a716-446655440000",
  subject: "Test onderwerp",
  message: "Test bericht",
  urgency: "normaal" as const,
};

const validFeedbackInput = {
  companyId: "550e8400-e29b-41d4-a716-446655440000",
  productId: "660e8400-e29b-41d4-a716-446655440000",
  action: "clicked" as const,
  recommendationScore: 85,
};

const validMarkAsReadInput = {
  notificationId: "550e8400-e29b-41d4-a716-446655440000",
};

const validMarkAllAsReadInput = {
  notificationIds: [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440000",
  ],
};

describe("Contact Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 10,
      resetInMs: 60000,
      warning: false,
      limit: 20,
      resetAt: 0,
    });
  });

  it("creates contact request successfully", async () => {
    const supabase = createMockSupabase({ id: "user-1" });
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { createContactRequest } = await import("@/lib/actions/contact.actions");
    const result = await createContactRequest(validContactInput);

    expect(result.success).toBe(true);
  });

  it("throws AuthError when not authenticated", async () => {
    const supabase = createMockSupabase(null);
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { createContactRequest } = await import("@/lib/actions/contact.actions");
    await expect(createContactRequest(validContactInput)).rejects.toThrow(AuthError);
  });

  it("throws RateLimitError when rate limited", async () => {
    const supabase = createMockSupabase({ id: "user-1" });
    mockedCreateClient.mockResolvedValue(supabase as never);
    mockedCheckRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetInMs: 30000,
      warning: true,
      limit: 20,
      resetAt: 0,
    });

    const { createContactRequest } = await import("@/lib/actions/contact.actions");
    await expect(createContactRequest(validContactInput)).rejects.toThrow(RateLimitError);
  });

  it("throws ValidationError for invalid input", async () => {
    const supabase = createMockSupabase({ id: "user-1" });
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { createContactRequest } = await import("@/lib/actions/contact.actions");
    await expect(
      createContactRequest({ ...validContactInput, subject: "" })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for invalid companyId", async () => {
    const supabase = createMockSupabase({ id: "user-1" });
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { createContactRequest } = await import("@/lib/actions/contact.actions");
    await expect(
      createContactRequest({ ...validContactInput, companyId: "not-a-uuid" })
    ).rejects.toThrow(ValidationError);
  });

  it("throws DatabaseError when insert fails", async () => {
    const supabase = createMockSupabase({ id: "user-1" }, { message: "insert failed" });
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { createContactRequest } = await import("@/lib/actions/contact.actions");
    await expect(createContactRequest(validContactInput)).rejects.toThrow(DatabaseError);
  });
});

describe("Notification Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks notification as read successfully", async () => {
    const supabase = createMockSupabase({ id: "user-1" });
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { markNotificationAsRead } = await import("@/lib/actions/notification.actions");
    const result = await markNotificationAsRead(validMarkAsReadInput);
    expect(result.success).toBe(true);
  });

  it("throws AuthError when not authenticated", async () => {
    const supabase = createMockSupabase(null);
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { markNotificationAsRead } = await import("@/lib/actions/notification.actions");
    await expect(markNotificationAsRead(validMarkAsReadInput)).rejects.toThrow(AuthError);
  });

  it("throws ValidationError for invalid notification ID", async () => {
    const supabase = createMockSupabase({ id: "user-1" });
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { markNotificationAsRead } = await import("@/lib/actions/notification.actions");
    await expect(
      markNotificationAsRead({ notificationId: "invalid" })
    ).rejects.toThrow(ValidationError);
  });

  it("marks all notifications as read successfully", async () => {
    const supabase = createMockSupabase({ id: "user-1" });
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { markAllNotificationsAsRead } = await import("@/lib/actions/notification.actions");
    const result = await markAllNotificationsAsRead(validMarkAllAsReadInput);
    expect(result.success).toBe(true);
  });

  it("throws ValidationError for empty notification IDs array", async () => {
    const supabase = createMockSupabase({ id: "user-1" });
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { markAllNotificationsAsRead } = await import("@/lib/actions/notification.actions");
    await expect(
      markAllNotificationsAsRead({ notificationIds: [] })
    ).rejects.toThrow(ValidationError);
  });
});

describe("Feedback Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records feedback successfully", async () => {
    const supabase = createMockSupabase({ id: "user-1" });
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { recordRecommendationFeedback } = await import("@/lib/actions/feedback.actions");
    const result = await recordRecommendationFeedback(validFeedbackInput);
    expect(result.success).toBe(true);
  });

  it("throws AuthError when not authenticated", async () => {
    const supabase = createMockSupabase(null);
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { recordRecommendationFeedback } = await import("@/lib/actions/feedback.actions");
    await expect(recordRecommendationFeedback(validFeedbackInput)).rejects.toThrow(AuthError);
  });

  it("throws ValidationError for invalid action", async () => {
    const supabase = createMockSupabase({ id: "user-1" });
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { recordRecommendationFeedback } = await import("@/lib/actions/feedback.actions");
    await expect(
      recordRecommendationFeedback({ ...validFeedbackInput, action: "invalid" as never })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for score out of range", async () => {
    const supabase = createMockSupabase({ id: "user-1" });
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { recordRecommendationFeedback } = await import("@/lib/actions/feedback.actions");
    await expect(
      recordRecommendationFeedback({ ...validFeedbackInput, recommendationScore: 150 })
    ).rejects.toThrow(ValidationError);
  });

  it("throws DatabaseError on insert failure", async () => {
    const supabase = createMockSupabase({ id: "user-1" }, { message: "db error" });
    mockedCreateClient.mockResolvedValue(supabase as never);

    const { recordRecommendationFeedback } = await import("@/lib/actions/feedback.actions");
    await expect(recordRecommendationFeedback(validFeedbackInput)).rejects.toThrow(DatabaseError);
  });
});
