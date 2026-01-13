"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSearch(query: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["search", query, page, limit],
    queryFn: () => api.searchProducts(query, page, limit),
    enabled: query.length >= 2,
  });
}
