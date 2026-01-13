"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCategory(
  slug: string,
  page: number = 1,
  limit: number = 20,
) {
  return useQuery({
    queryKey: ["category", slug, page, limit],
    queryFn: () => api.getCategory(slug, page, limit),
    enabled: !!slug,
  });
}
