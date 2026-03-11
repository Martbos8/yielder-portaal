import { Skeleton } from "@/components/ui/skeleton";

export default function FacturenLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-32 mb-6" />

      <div className="bg-card rounded-2xl p-12 shadow-card border border-border flex flex-col items-center justify-center">
        <Skeleton className="w-20 h-20 rounded-full mb-5" />
        <Skeleton className="h-6 w-72 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}
