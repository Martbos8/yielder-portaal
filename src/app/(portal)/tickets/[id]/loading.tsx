import { Skeleton } from "@/components/ui/skeleton";

export default function TicketDetailLoading() {
  return (
    <div>
      <Skeleton className="h-4 w-36 mb-4" />

      <div className="bg-card rounded-2xl shadow-card border border-border p-6 md:p-8">
        <div className="flex items-start gap-3 mb-6">
          <Skeleton className="h-7 flex-1" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>

        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-16 w-full mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-2">
              <Skeleton className="h-4 w-4 mt-0.5" />
              <div>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
