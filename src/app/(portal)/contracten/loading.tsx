import { Skeleton } from "@/components/ui/skeleton";

export default function ContractenLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-40 mb-6" />

      {/* Totaal maandbedrag skeleton */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6">
        <Skeleton className="h-3 w-32 mb-2" />
        <Skeleton className="h-8 w-36" />
      </div>

      {/* Contract cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-2xl p-5 shadow-card border border-border space-y-3"
          >
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}
