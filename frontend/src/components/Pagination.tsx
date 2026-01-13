"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/types";

interface PaginationProps {
  pagination: PaginationMeta;
  baseUrl: string;
}

export function Pagination({ pagination, baseUrl }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { page, totalPages, hasNextPage, hasPrevPage, totalItems } = pagination;

  const navigateToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${baseUrl}?${params.toString()}`);
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between py-4">
      <p className="text-sm text-muted-foreground">
        Showing page {page} of {totalPages} ({totalItems} items)
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(page - 1)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {generatePageNumbers(page, totalPages).map((pageNum, idx) =>
            pageNum === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                onClick={() => navigateToPage(pageNum as number)}
                className="w-9"
              >
                {pageNum}
              </Button>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(page + 1)}
          disabled={!hasNextPage}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function generatePageNumbers(
  current: number,
  total: number,
): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  if (current <= 3) {
    pages.push(1, 2, 3, 4, "...", total);
  } else if (current >= total - 2) {
    pages.push(1, "...", total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }

  return pages;
}
