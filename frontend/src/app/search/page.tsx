"use client";

import { Search as SearchIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { ProductGrid } from "@/components/ProductGrid";
import { SearchBar } from "@/components/SearchBar";
import { useSearch } from "@/hooks/use-search";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading, isError } = useSearch(query, page);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto mb-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <SearchIcon className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Search Books</h1>
        <SearchBar defaultValue={query} className="max-w-md mx-auto" />
      </div>

      {/* Search Results */}
      {query ? (
        <div>
          {/* Results Header */}
          {data && !isLoading && (
            <div className="mb-6">
              <p className="text-muted-foreground">
                {data.data.pagination.totalItems === 0 ? (
                  <>No results found for &quot;{query}&quot;</>
                ) : (
                  <>
                    Found {data.data.pagination.totalItems} results for &quot;
                    {query}&quot;
                  </>
                )}
              </p>
            </div>
          )}

          {/* Products Grid */}
          <ProductGrid
            products={data?.data.items || []}
            isLoading={isLoading}
          />

          {/* Pagination */}
          {data && data.data.pagination.totalPages > 1 && (
            <Pagination pagination={data.data.pagination} baseUrl="/search" />
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-12">
              <p className="text-destructive">
                Failed to load search results. Please try again.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Enter a search term to find books.
          </p>
        </div>
      )}
    </div>
  );
}
