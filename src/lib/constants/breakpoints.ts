/**
 * Responsive breakpoints matching Tailwind defaults.
 * Use for programmatic responsive logic (e.g., window.matchMedia).
 * Prefer Tailwind responsive prefixes (sm:, md:, lg:) in components.
 */

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;
