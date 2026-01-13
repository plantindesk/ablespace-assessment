import type {
  CategoriesResponse,
  CategoryResponse,
  ProductResponse,
  SearchResponse,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError(404, "Resource not found");
    }
    throw new ApiError(response.status, `API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  /**
   * Get all categories
   */
  getCategories: (): Promise<CategoriesResponse> => {
    return fetchApi<CategoriesResponse>("/catalog/categories");
  },

  /**
   * Get category with products
   */
  getCategory: (
    slug: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<CategoryResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return fetchApi<CategoryResponse>(`/catalog/category/${slug}?${params}`);
  },

  /**
   * Get product details
   */
  getProduct: (slug: string): Promise<ProductResponse> => {
    return fetchApi<ProductResponse>(`/catalog/product/${slug}`);
  },

  /**
   * Search products
   */
  searchProducts: (
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchResponse> => {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString(),
    });
    return fetchApi<SearchResponse>(`/catalog/search?${params}`);
  },

  /**
   * Force refresh category
   */
  refreshCategory: (slug: string): Promise<CategoryResponse> => {
    return fetchApi<CategoryResponse>(`/catalog/category/${slug}/refresh`, {
      method: "POST",
    });
  },

  /**
   * Force refresh product
   */
  refreshProduct: (slug: string): Promise<ProductResponse> => {
    return fetchApi<ProductResponse>(`/catalog/product/${slug}/refresh`, {
      method: "POST",
    });
  },
};

export { ApiError };
