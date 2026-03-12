"use client";

import { useEffect, useRef, useState } from "react";

/** Props for the MetricRing component. */
interface MetricRingProps {
  /** Score value (0-100). */
  score: number;
  /** Size of the ring in pixels (default: 128). */
  size?: number;
  /** Stroke width (default: 8). */
  strokeWidth?: number;
  /** Optional label shown below the ring. */
  label?: string;
  /** Optional description text below the label. */
  description?: string;
}

const CIRCUMFERENCE = 351.86; // 2 * PI * 56 (r=56 in a 128-viewBox circle)

/** Returns Tailwind color classes based on score thresholds. */
function getScoreColors(score: number) {
  if (score < 50) return { stroke: "stroke-red-500", text: "text-red-500" };
  if (score < 80) return { stroke: "stroke-yielder-orange", text: "text-yielder-orange" };
  return { stroke: "stroke-emerald-500", text: "text-emerald-500" };
}

/**
 * SVG-based circular progress ring for score/percentage display.
 * Animates the fill on first render using CSS transitions.
 */
export function MetricRing({
  score,
  size = 128,
  strokeWidth = 8,
  label,
  description,
}: MetricRingProps) {
  const colors = getScoreColors(score);
  const [animated, setAnimated] = useState(false);
  const ref = useRef<SVGCircleElement>(null);

  // Trigger animation after mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const dashArray = animated
    ? `${(score / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`
    : `0 ${CIRCUMFERENCE}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="-rotate-90"
          viewBox="0 0 128 128"
          width={size}
          height={size}
          role="img"
          aria-label={`${label ? `${label}: ` : ""}${score} procent`}
        >
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          <circle
            ref={ref}
            cx="64"
            cy="64"
            r="56"
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={dashArray}
            className={`${colors.stroke} score-ring-animated`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className={`text-3xl font-bold ${colors.text}`}>
            {score}%
          </span>
        </div>
      </div>
      {label && (
        <p className="text-xs font-medium text-muted-foreground mt-2">
          {label}
        </p>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Returns a description string based on the IT score value.
 */
export function getScoreDescription(score: number): string {
  if (score >= 80) return "Uw IT-omgeving is goed op orde";
  if (score >= 50) return "Er zijn verbeteringen mogelijk";
  return "Directe aandacht vereist";
}
