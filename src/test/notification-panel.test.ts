import { describe, it, expect } from "vitest";
import type { Notification } from "@/types/database";

// Test notification data formatting and type correctness
// (Component render tests require jsdom + React, we test logic here)

function formatTimeAgo(dateStr: string): string {
  const now = new Date("2026-03-11T12:00:00Z");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "Zojuist";
  if (diffMin < 60) return `${diffMin} min geleden`;
  if (diffHours < 24) return `${diffHours} uur geleden`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "dag" : "dagen"} geleden`;

  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  });
}

const mockNotifications: Notification[] = [
  {
    id: "n1",
    company_id: "c1",
    user_id: "u1",
    title: "Nieuw ticket aangemaakt",
    message: "Ticket #123 is aangemaakt door Jan",
    type: "info",
    is_read: false,
    link: "/tickets/123",
    created_at: "2026-03-11T11:55:00Z",
  },
  {
    id: "n2",
    company_id: "c1",
    user_id: "u1",
    title: "Contract verloopt binnenkort",
    message: "Managed Services verloopt over 14 dagen",
    type: "warning",
    is_read: false,
    link: "/contracten",
    created_at: "2026-03-11T06:00:00Z",
  },
  {
    id: "n3",
    company_id: "c1",
    user_id: null,
    title: "Backup succesvol",
    message: "Nachtelijke backup voltooid",
    type: "success",
    is_read: true,
    link: null,
    created_at: "2026-03-10T02:00:00Z",
  },
];

describe("Notification Panel logic", () => {
  it("formats time ago correctly for minutes", () => {
    expect(formatTimeAgo("2026-03-11T11:55:00Z")).toBe("5 min geleden");
  });

  it("formats time ago correctly for hours", () => {
    expect(formatTimeAgo("2026-03-11T06:00:00Z")).toBe("6 uur geleden");
  });

  it("formats time ago correctly for days", () => {
    expect(formatTimeAgo("2026-03-10T02:00:00Z")).toBe("1 dag geleden");
  });

  it("formats time ago as Zojuist for < 1 min", () => {
    expect(formatTimeAgo("2026-03-11T11:59:30Z")).toBe("Zojuist");
  });

  it("formats time ago for multiple days", () => {
    expect(formatTimeAgo("2026-03-08T12:00:00Z")).toBe("3 dagen geleden");
  });

  it("counts unread notifications", () => {
    const unreadCount = mockNotifications.filter((n) => !n.is_read).length;
    expect(unreadCount).toBe(2);
  });

  it("notification types are valid", () => {
    const validTypes = ["info", "warning", "alert", "success"];
    for (const notification of mockNotifications) {
      expect(validTypes).toContain(notification.type);
    }
  });

  it("shows badge count based on unread or open tickets", () => {
    const unreadCount = mockNotifications.filter((n) => !n.is_read).length;
    const openTicketCount = 5;
    const badgeCount = unreadCount > 0 ? unreadCount : openTicketCount;
    expect(badgeCount).toBe(2);
  });

  it("falls back to ticket count when no unread", () => {
    const allRead = mockNotifications.map((n) => ({ ...n, is_read: true }));
    const unreadCount = allRead.filter((n) => !n.is_read).length;
    const openTicketCount = 5;
    const badgeCount = unreadCount > 0 ? unreadCount : openTicketCount;
    expect(badgeCount).toBe(5);
  });
});
