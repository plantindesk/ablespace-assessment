"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.getProduct(slug),
    enabled: !!slug,
    // Product details might take time if scraping, so longer stale time
    staleTime: 5 * 60 * 1000,
  });
}
