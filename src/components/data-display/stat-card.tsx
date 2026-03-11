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
  /** Optional trend indicator: percentage change (positive = up, negative = down). */
  trend?: number;
  /** Optional label for the trend (e.g. "vs vorige maand"). */
  trendLabel?: string;
  /** Optional sparkline data points (0-1 normalized values). */
  sparkline?: number[];
}

/** Renders a tiny SVG sparkline chart inside a stat card. */
function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;
  const w = 80;
  const h = 24;
  const padding = 2;
  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (w - padding * 2);
      const y = h - padding - ((v - minVal) / range) * (h - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Reusable KPI card for dashboards and summary strips.
 * Displays a label, large value, optional icon, trend indicator, and sparkline.
 */
export function StatCard({ label, value, icon, suffix, description, trend, trendLabel, sparkline }: StatCardProps) {
  const hasTrend = trend !== undefined && trend !== 0;
  const trendUp = (trend ?? 0) > 0;
  const trendColor = trendUp
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";
  const trendIcon = trendUp ? "trending_up" : "trending_down";
  const sparklineColor = trendUp
    ? "text-emerald-500/60"
    : (trend ?? 0) < 0
      ? "text-red-500/60"
      : "text-muted-foreground/40";

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

      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-3xl font-bold text-foreground">
            {value}
          </span>
          {suffix && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {suffix}
            </span>
          )}
        </div>
        {sparkline && sparkline.length >= 2 && (
          <Sparkline data={sparkline} className={sparklineColor} />
        )}
      </div>

      {hasTrend && (
        <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
          <MaterialIcon name={trendIcon} size={14} />
          <span className="text-xs font-medium">
            {trendUp ? "+" : ""}
            {Math.round(trend)}%
          </span>
          {trendLabel && (
            <span className="text-xs text-muted-foreground ml-0.5">
              {trendLabel}
            </span>
          )}
        </div>
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
