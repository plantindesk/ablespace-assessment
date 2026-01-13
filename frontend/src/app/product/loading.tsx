import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-5 w-32 mb-6" />

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <Skeleton className="aspect-3/4 rounded-lg" />

        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
