import { Badge } from "@/components/ui/badge";
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  AGREEMENT_STATUS,
  LICENSE_STATUS,
  WARRANTY_STATUS,
  SEVERITY,
  type StatusStyle,
} from "@/lib/constants/status";

/**
 * Re-export configs under their original names for backward compatibility.
 * These are now defined in @/lib/constants/status (single source of truth).
 */
export type { StatusStyle };
export const ticketStatusConfig = TICKET_STATUS as Record<string, StatusStyle>;
export const ticketPriorityConfig = TICKET_PRIORITY as Record<string, StatusStyle>;
export const agreementStatusConfig = AGREEMENT_STATUS as Record<string, StatusStyle>;
export const licenseStatusConfig = LICENSE_STATUS as Record<string, StatusStyle>;
export const warrantyStatusConfig = WARRANTY_STATUS as Record<string, StatusStyle & { icon: string }>;
export const severityConfig = SEVERITY as Record<string, StatusStyle>;

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
