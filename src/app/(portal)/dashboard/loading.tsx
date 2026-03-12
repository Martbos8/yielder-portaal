import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-40 mb-6" />

      {/* KPI skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-2xl p-5 shadow-card border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <div className="flex items-end justify-between">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-3 w-32 mt-2" />
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card shadow-card"
          >
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-28 mb-1" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>

      {/* Widget skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendations — full width */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border lg:col-span-2">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent tickets */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Attention points */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-40 flex-1" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity — full width */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border lg:col-span-2">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-44 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
