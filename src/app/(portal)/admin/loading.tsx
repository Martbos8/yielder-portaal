import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-2xl p-5 shadow-card border">
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-48 mt-2" />
          </Card>
        ))}
      </div>

      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl p-4 shadow-card border">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-36" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
