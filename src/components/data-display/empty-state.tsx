import { MaterialIcon } from "@/components/icon";

/** Props for EmptyState component. */
interface EmptyStateProps {
  /** Material icon name. */
  icon: string;
  /** Main message to display. */
  message: string;
  /** Optional heading above the message. */
  heading?: string;
  /** Optional description below the message. */
  description?: string;
  /** Icon className override (default: text-muted-foreground/50). */
  iconClassName?: string;
  /** Icon size (default: 48). */
  iconSize?: number;
  /** Optional action element (button, link). */
  action?: React.ReactNode;
}

/**
 * Reusable empty state component with icon, message, and optional action.
 * Used when a list or section has no data to display.
 */
export function EmptyState({
  icon,
  message,
  heading,
  description,
  iconClassName = "text-muted-foreground/50",
  iconSize = 48,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-card rounded-2xl p-12 shadow-card border border-border flex flex-col items-center justify-center text-muted-foreground">
      <MaterialIcon
        name={icon}
        className={`${iconClassName} mb-3`}
        size={iconSize}
      />
      {heading && (
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {heading}
        </h3>
      )}
      <p className="text-sm">{message}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Inline empty state for widgets/cards (smaller padding, no card wrapper).
 */
export function EmptyStateInline({
  icon,
  message,
  iconClassName = "text-emerald-500",
  iconSize = 32,
}: Pick<EmptyStateProps, "icon" | "message" | "iconClassName" | "iconSize">) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <MaterialIcon
        name={icon}
        className={`${iconClassName} mb-2`}
        size={iconSize}
      />
      <p className="text-sm">{message}</p>
    </div>
  );
}
