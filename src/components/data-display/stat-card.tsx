import { MaterialIcon } from "@/components/icon";

/** Props for a KPI/stat card. */
interface StatCardProps {
  /** Label shown above the value. */
  label: string;
  /** Main value to display (pre-formatted). */
  value: string;
  /** Material icon name. */
  icon?: string;
  /** Optional sub-label shown after the value (e.g. "/mnd"). */
  suffix?: string;
  /** Optional description text below the value. */
  description?: string;
}

/**
 * Reusable KPI card for dashboards and summary strips.
 * Displays a label, large value, and optional icon.
 */
export function StatCard({ label, value, icon, suffix, description }: StatCardProps) {
  return (
    <div
      className="bg-card rounded-2xl p-5 shadow-card border border-border
        hover:shadow-card-hover hover:scale-[1.015] transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        {icon && (
          <MaterialIcon
            name={icon}
            className="text-yielder-navy/70"
            size={20}
          />
        )}
      </div>
      <span className="text-3xl font-bold text-foreground">
        {value}
      </span>
      {suffix && (
        <span className="text-sm font-normal text-muted-foreground ml-1">
          {suffix}
        </span>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

/**
 * Compact stat card variant used in summary strips (e.g. license/contract overviews).
 * Smaller padding, uppercase label.
 */
export function StatCardCompact({ label, value, icon, suffix }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
      <div className="flex items-center gap-2 mb-1">
        {icon && (
          <MaterialIcon
            name={icon}
            className="text-yielder-navy/70"
            size={16}
          />
        )}
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-2xl font-semibold text-yielder-navy">
        {value}
        {suffix && (
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}
