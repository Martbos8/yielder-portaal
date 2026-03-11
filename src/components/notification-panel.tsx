"use client";

import { useState, useRef, useEffect } from "react";
import { MaterialIcon } from "./icon";
import type { Notification } from "@/types/database";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/actions/notification.actions";

interface NotificationPanelProps {
  notifications: Notification[];
  openTicketCount: number;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
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

const TYPE_ICON: Record<string, string> = {
  info: "info",
  warning: "warning",
  alert: "error",
  success: "check_circle",
};

const TYPE_COLOR: Record<string, string> = {
  info: "text-blue-500",
  warning: "text-amber-500",
  alert: "text-rose-500",
  success: "text-emerald-500",
};

export function NotificationPanel({
  notifications,
  openTicketCount,
}: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const badgeCount = unreadCount > 0 ? unreadCount : openTicketCount;

  // Close panel on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markNotificationAsRead({ notificationId });
    } catch {
      // Silently fail — notification state will refresh on next page load
    }
  }

  async function handleMarkAllAsRead() {
    const unreadIds = notifications
      .filter((n) => !n.is_read)
      .map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      await markAllNotificationsAsRead({ notificationIds: unreadIds });
    } catch {
      // Silently fail — notification state will refresh on next page load
    }
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center size-10 rounded-xl text-slate-400 hover:text-yielder-navy hover:bg-yielder-navy/[0.04] transition-all"
      >
        <MaterialIcon name="notifications" size={22} />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white px-1 animate-badge-pulse">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-card-hover border border-slate-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-yielder-navy">
              Meldingen
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-yielder-orange hover:text-yielder-orange/80 font-medium transition-colors"
              >
                Alles gelezen
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <MaterialIcon
                  name="notifications_none"
                  size={32}
                  className="text-slate-300 mx-auto mb-2"
                />
                <p className="text-sm text-slate-400">Geen meldingen</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-warm-50 transition-colors border-b border-slate-50 last:border-b-0 ${
                    !notification.is_read ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    <MaterialIcon
                      name={TYPE_ICON[notification.type] ?? "info"}
                      size={18}
                      className={TYPE_COLOR[notification.type] ?? "text-blue-500"}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="shrink-0 mt-2">
                      <span className="size-2 rounded-full bg-yielder-orange block" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
