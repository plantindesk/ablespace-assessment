export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CategoryWithProducts {
  category: {
    id: string;
    title: string;
    slug: string;
    productCount: number;
    lastScrapedAt: Date | null;
  };
  products: PaginatedResult<ProductSummary>;
}

export interface ProductSummary {
  id: string;
  sourceId: string;
  title: string;
  author: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  slug: string;
  url: string;
  hasDetail: boolean;
}

export interface ProductWithDetail {
  id: string;
  sourceId: string;
  title: string;
  author: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  imageUrls: string[];
  slug: string;
  url: string;
  lastScrapedAt: Date | null;
  detail: {
    description: string | null;
    specs: Record<string, string>;
    ratingsAvg: number | null;
    reviewsCount: number;
    conditions: ProductConditionInfo[];
    inStock: boolean;
  } | null;
}

export interface ProductConditionInfo {
  type: string;
  label: string;
  price: number;
  available: boolean;
}

export interface StalenessConfig {
  categoryMaxAgeMs: number;
  productMaxAgeMs: number;
}
