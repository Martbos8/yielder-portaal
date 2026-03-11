import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function UpgradeLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Score + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl p-6 shadow-card border flex flex-col items-center justify-center">
          <Skeleton className="h-4 w-20 mb-4" />
          <Skeleton className="size-32 rounded-full" />
          <Skeleton className="h-3 w-40 mt-4" />
        </Card>
        <Card className="rounded-2xl p-6 shadow-card border">
          <Skeleton className="h-4 w-20 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </Card>
        <Card className="rounded-2xl p-6 shadow-card border">
          <Skeleton className="h-4 w-28 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
      </div>

      {/* Recommendation cards */}
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl p-5 shadow-card border">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
