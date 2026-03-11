"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <Skeleton className="w-full h-full rounded-xl" />
    </div>
  );
}

function RingSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <Skeleton className="w-28 h-28 rounded-full" />
      <Skeleton className="w-16 h-3 mt-2" />
    </div>
  );
}

/** Lazy-loaded SLATrendChart — Recharts is not included in initial bundle. */
export const LazySLATrendChart = dynamic(
  () => import("@/components/performance-charts").then((mod) => ({ default: mod.SLATrendChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);

/** Lazy-loaded CategoryChart — Recharts is not included in initial bundle. */
export const LazyCategoryChart = dynamic(
  () => import("@/components/performance-charts").then((mod) => ({ default: mod.CategoryChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);

/** Lazy-loaded HealthTrendChart — Recharts is not included in initial bundle. */
export const LazyHealthTrendChart = dynamic(
  () => import("@/components/health-charts").then((mod) => ({ default: mod.HealthTrendChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);

/** Lazy-loaded ScoreRing — Recharts is not included in initial bundle. */
export const LazyScoreRing = dynamic(
  () => import("@/components/health-charts").then((mod) => ({ default: mod.ScoreRing })),
  { loading: () => <RingSkeleton />, ssr: false }
);
