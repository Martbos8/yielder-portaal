import { Badge } from "@/components/ui/badge";
import type {
  TicketStatus,
  TicketPriority,
  AgreementStatus,
  LicenseStatus,
} from "@/types/database";
import type { WarrantyStatus } from "@/lib/hardware-utils";

/**
 * Status badge style config: label + Tailwind className.
 */
export interface StatusStyle {
  label: string;
  className: string;
}

/** Ticket status → badge style mapping. */
export const ticketStatusConfig: Record<TicketStatus, StatusStyle> = {
  open: {
    label: "Open",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  in_progress: {
    label: "In behandeling",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  closed: {
    label: "Gesloten",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

/** Ticket priority → badge style mapping. */
export const ticketPriorityConfig: Record<TicketPriority, StatusStyle> = {
  urgent: {
    label: "Urgent",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  high: {
    label: "Hoog",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  normal: {
    label: "Normaal",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  low: {
    label: "Laag",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

/** Agreement status → badge style mapping. */
export const agreementStatusConfig: Record<AgreementStatus, StatusStyle> = {
  active: {
    label: "Actief",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  expired: {
    label: "Verlopen",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  cancelled: {
    label: "Opgezegd",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

/** License status → badge style mapping. */
export const licenseStatusConfig: Record<LicenseStatus, StatusStyle> = {
  active: {
    label: "Actief",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  expiring: {
    label: "Verloopt binnenkort",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  expired: {
    label: "Verlopen",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

/** Hardware warranty status → badge style + icon mapping. */
export const warrantyStatusConfig: Record<
  WarrantyStatus,
  StatusStyle & { icon: string }
> = {
  valid: {
    label: "Geldig",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: "verified",
  },
  expiring: {
    label: "Verloopt binnenkort",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    icon: "warning",
  },
  expired: {
    label: "Verlopen",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: "error",
  },
  unknown: {
    label: "Onbekend",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    icon: "help",
  },
};

/** Severity badge styles. */
export const severityConfig: Record<string, StatusStyle> = {
  critical: {
    label: "Kritiek",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  warning: {
    label: "Aanbevolen",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  info: {
    label: "Suggestie",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
};

/** Props for StatusBadge component. */
interface StatusBadgeProps {
  /** The status value to render. */
  status: string;
  /** Config map to look up the style. */
  config: Record<string, StatusStyle>;
  /** Additional className on the Badge. */
  className?: string;
}

/**
 * Universal status badge that renders a styled Badge from a config map.
 * Works for tickets, agreements, licenses, severity, and any other status type.
 */
export function StatusBadge({ status, config, className }: StatusBadgeProps) {
  const style = config[status];
  if (!style) return null;

  return (
    <Badge className={`${style.className}${className ? ` ${className}` : ""}`}>
      {style.label}
    </Badge>
  );
}

/**
 * Returns the severity indicator dot (small colored circle).
 */
export function SeverityDot({ severity }: { severity: string | null }) {
  const colorMap: Record<string, string> = {
    critical: "bg-red-500",
    warning: "bg-orange-400",
  };
  const color = (severity && colorMap[severity]) || "bg-blue-400";
  return <span className={`size-2 rounded-full ${color} shrink-0`} />;
}
