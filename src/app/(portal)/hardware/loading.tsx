import { Skeleton } from "@/components/ui/skeleton";

export default function HardwareLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-40 mb-6" />

      {/* Type group skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mb-8">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="bg-card rounded-2xl p-5 shadow-card border border-border space-y-3"
              >
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-36" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
