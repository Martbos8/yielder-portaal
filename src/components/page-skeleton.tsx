import { Skeleton } from "@/components/ui/skeleton";

type SkeletonVariant = "table" | "cards" | "detail";

interface PageSkeletonProps {
  title?: boolean;
  filters?: boolean;
  variant?: SkeletonVariant;
  rows?: number;
  columns?: number;
  cards?: number;
}

function TableSkeleton({
  rows = 8,
  columns = 6,
}: {
  rows: number;
  columns: number;
}) {
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-border last:border-0">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardsSkeleton({ cards = 6 }: { cards: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-2xl p-5 shadow-card border border-border space-y-3"
        >
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-36" />
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-4 w-48" />
      <div className="space-y-3 pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PageSkeleton({
  title = true,
  filters = false,
  variant = "table",
  rows = 8,
  columns = 6,
  cards = 6,
}: PageSkeletonProps) {
  return (
    <div>
      {title && <Skeleton className="h-8 w-40 mb-6" />}

      {filters && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
      )}

      {variant === "table" && (
        <TableSkeleton rows={rows} columns={columns} />
      )}
      {variant === "cards" && <CardsSkeleton cards={cards} />}
      {variant === "detail" && <DetailSkeleton />}
    </div>
  );
}
