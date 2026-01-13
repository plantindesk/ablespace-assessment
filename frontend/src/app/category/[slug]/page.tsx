import { Suspense } from "react";
import { CategoryClient } from "./client";
import { api } from "@/lib/api";

export async function generateStaticParams() {
  const response = await api.getCategories();
  return response.data.map((category) => ({
    slug: category.slug,
  }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={<CategoryClientSkeleton />}>
      <CategoryClient slug={slug} />
    </Suspense>
  );
}

function CategoryClientSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-3/4 bg-muted animate-pulse rounded-lg" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
