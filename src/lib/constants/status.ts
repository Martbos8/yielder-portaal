/**
 * Status labels, colors, and icons per entity type.
 * Single source of truth for all status rendering across the portal.
 * Used by StatusBadge component and anywhere status display is needed.
 */

import { STATUS_BADGE_CLASSES } from "./colors";

/** Status style definition. */
export interface StatusStyle {
  label: string;
  className: string;
  icon?: string;
}

// ── Ticket Status ─────────────────────────────────────────────

export const TICKET_STATUS = {
  open: {
    label: "Open",
    className: STATUS_BADGE_CLASSES.success,
  },
  in_progress: {
    label: "In behandeling",
    className: STATUS_BADGE_CLASSES.warning,
  },
  closed: {
    label: "Gesloten",
    className: STATUS_BADGE_CLASSES.neutral,
  },
} as const satisfies Record<string, StatusStyle>;

// ── Ticket Priority ───────────────────────────────────────────

export const TICKET_PRIORITY = {
  urgent: {
    label: "Urgent",
    className: STATUS_BADGE_CLASSES.error,
  },
  high: {
    label: "Hoog",
    className: STATUS_BADGE_CLASSES.warning,
  },
  normal: {
    label: "Normaal",
    className: STATUS_BADGE_CLASSES.info,
  },
  low: {
    label: "Laag",
    className: STATUS_BADGE_CLASSES.neutral,
  },
} as const satisfies Record<string, StatusStyle>;

// ── Agreement Status ──────────────────────────────────────────

export const AGREEMENT_STATUS = {
  active: {
    label: "Actief",
    className: STATUS_BADGE_CLASSES.success,
  },
  expired: {
    label: "Verlopen",
    className: STATUS_BADGE_CLASSES.error,
  },
  cancelled: {
    label: "Opgezegd",
    className: STATUS_BADGE_CLASSES.neutral,
  },
} as const satisfies Record<string, StatusStyle>;

// ── License Status ────────────────────────────────────────────

export const LICENSE_STATUS = {
  active: {
    label: "Actief",
    className: STATUS_BADGE_CLASSES.success,
  },
  expiring: {
    label: "Verloopt binnenkort",
    className: STATUS_BADGE_CLASSES.warning,
  },
  expired: {
    label: "Verlopen",
    className: STATUS_BADGE_CLASSES.error,
  },
} as const satisfies Record<string, StatusStyle>;

// ── Hardware Warranty Status ──────────────────────────────────

export const WARRANTY_STATUS = {
  valid: {
    label: "Geldig",
    className: STATUS_BADGE_CLASSES.success,
    icon: "verified",
  },
  expiring: {
    label: "Verloopt binnenkort",
    className: STATUS_BADGE_CLASSES.warning,
    icon: "warning",
  },
  expired: {
    label: "Verlopen",
    className: STATUS_BADGE_CLASSES.error,
    icon: "error",
  },
  unknown: {
    label: "Onbekend",
    className: STATUS_BADGE_CLASSES.neutral,
    icon: "help",
  },
} as const satisfies Record<string, StatusStyle>;

// ── Severity (recommendations, alerts) ────────────────────────

export const SEVERITY = {
  critical: {
    label: "Kritiek",
    className: STATUS_BADGE_CLASSES.error,
  },
  warning: {
    label: "Aanbevolen",
    className: STATUS_BADGE_CLASSES.warning,
  },
  info: {
    label: "Suggestie",
    className: STATUS_BADGE_CLASSES.info,
  },
} as const satisfies Record<string, StatusStyle>;

// ── Notification Types ────────────────────────────────────────

export const NOTIFICATION_TYPE = {
  info: {
    label: "Informatie",
    className: STATUS_BADGE_CLASSES.info,
    icon: "info",
  },
  warning: {
    label: "Waarschuwing",
    className: STATUS_BADGE_CLASSES.warning,
    icon: "warning",
  },
  alert: {
    label: "Waarschuwing",
    className: STATUS_BADGE_CLASSES.error,
    icon: "error",
  },
  success: {
    label: "Succes",
    className: STATUS_BADGE_CLASSES.success,
    icon: "check_circle",
  },
} as const satisfies Record<string, StatusStyle>;
