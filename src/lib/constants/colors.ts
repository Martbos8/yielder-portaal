/**
 * Yielder brand colors as TypeScript constants.
 * These match the values in tailwind.config.ts and globals.css.
 * Use Tailwind classes (e.g. `text-yielder-navy`) in components.
 * Use these constants for programmatic access (charts, canvas, emails).
 */

export const COLORS = {
  /** Primary brand navy — headings, sidebar accents, CTA backgrounds */
  navy: "#1f3b61",
  navyWarm: "#2a4a7a",
  navyDark: "#17304f",

  /** Accent orange — CTAs, highlights, action buttons */
  orange: "#f5a623",

  /** Gold — premium accents, subtle highlights */
  gold: "#c9a96e",
  goldLight: "#f0e6d3",

  /** Warm background palette */
  warm50: "#fefdfb",
  warm100: "#faf8f5",
  warm200: "#f5f1eb",
  warm300: "#ebe5db",
  surfaceWarm: "#fdfcfa",

  /** Card & surface */
  background: "#faf8f5",
  card: "#ffffff",
  foreground: "#0f172a",
} as const;

/** Semantic status colors (Tailwind class prefixes). */
export const STATUS_COLORS = {
  success: "emerald",
  warning: "orange",
  error: "red",
  info: "blue",
  neutral: "gray",
} as const;

/** Status color class patterns for badges. */
export const STATUS_BADGE_CLASSES = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
} as const;
