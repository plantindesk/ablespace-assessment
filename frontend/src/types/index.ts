export interface Category {
  id: string;
  title: string;
  slug: string;
  productCount: number;
  lastScrapedAt: string | null;
}

export interface ProductSummary {
  id: string;
  sourceId: string;
  title: string;
  author?: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  slug: string;
  url: string;
  hasDetail?: boolean;
}

export interface ProductCondition {
  type: string;
  label: string;
  price: number;
  available: boolean;
}

export interface ProductDetailInfo {
  description: string | null;
  specs: Record<string, string>;
  ratingsAvg: number | null;
  reviewsCount: number;
  conditions: ProductCondition[];
  inStock: boolean;
}

export interface ProductDetail {
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
  lastScrapedAt: string | null;
  detail: ProductDetailInfo | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedProducts {
  items: ProductSummary[];
  pagination: PaginationMeta;
}

export interface CategoryWithProducts {
  category: Category;
  products: PaginatedProducts;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

export interface CategoryResponse {
  success: boolean;
  data: CategoryWithProducts;
}

export interface ProductResponse {
  success: boolean;
  data: ProductDetail;
}

export interface SearchResponse {
  success: boolean;
  data: PaginatedProducts;
}
