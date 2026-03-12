/**
 * Design system theme: consistent badge variants and color mappings per entity.
 * Import status configs from @/lib/constants/status for badge rendering.
 * This file re-exports status configs grouped by entity for component convenience.
 */

import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  AGREEMENT_STATUS,
  LICENSE_STATUS,
  WARRANTY_STATUS,
  SEVERITY,
  NOTIFICATION_TYPE,
} from "@/lib/constants/status";

/** Badge variant configs indexed by entity type. */
export const BADGE_CONFIGS = {
  ticketStatus: TICKET_STATUS,
  ticketPriority: TICKET_PRIORITY,
  agreementStatus: AGREEMENT_STATUS,
  licenseStatus: LICENSE_STATUS,
  warrantyStatus: WARRANTY_STATUS,
  severity: SEVERITY,
  notificationType: NOTIFICATION_TYPE,
} as const;

export type BadgeConfigKey = keyof typeof BADGE_CONFIGS;

/**
 * Get the badge className for a status value within a config.
 * Returns neutral style if status is not found.
 */
export function getBadgeClassName(
  configKey: BadgeConfigKey,
  status: string,
): string {
  const config = BADGE_CONFIGS[configKey] as Record<string, { className: string }>;
  return config[status]?.className ?? "bg-gray-100 text-gray-600";
}

/**
 * Get the badge label for a status value within a config.
 * Returns the raw status string if not found.
 */
export function getBadgeLabel(
  configKey: BadgeConfigKey,
  status: string,
): string {
  const config = BADGE_CONFIGS[configKey] as Record<string, { label: string }>;
  return config[status]?.label ?? status;
}
