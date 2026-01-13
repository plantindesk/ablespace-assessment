"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FolderOpen, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { ProductGrid } from "@/components/ProductGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategory } from "@/hooks/use-category";
import { api } from "@/lib/api";
import { getRelativeTime } from "@/lib/utils";

interface CategoryClientProps {
  slug: string;
}

export function CategoryClient({ slug }: CategoryClientProps) {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useCategory(slug, page);

  const refreshMutation = useMutation({
    mutationFn: () => api.refreshCategory(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category", slug] });
    },
  });

  if (isLoading) {
    return <CategoryPageSkeleton />;
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Category Not Found</h1>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "Failed to load category"}
          </p>
        </div>
      </div>
    );
  }

  const { category, products } = data!.data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{category.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <Badge variant="secondary">{category.productCount} books</Badge>
              <span>Updated {getRelativeTime(category.lastScrapedAt)}</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`}
          />
          {refreshMutation.isPending ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      <ProductGrid products={products.items} />

      <Pagination
        pagination={products.pagination}
        baseUrl={`/category/${slug}`}
      />
    </div>
  );
}

function CategoryPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-3/4 rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
