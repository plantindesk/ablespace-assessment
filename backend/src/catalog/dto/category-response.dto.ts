export class CategoryResponseDto {
  category: {
    id: string;
    title: string;
    slug: string;
    productCount: number;
    lastScrapedAt: Date | null;
  };

  products: {
    items: ProductSummaryDto[];
    pagination: PaginationMetaDto;
  };
}

export class ProductSummaryDto {
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

export class PaginationMetaDto {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
