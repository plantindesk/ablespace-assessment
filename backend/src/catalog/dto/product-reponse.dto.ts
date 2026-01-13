export class ProductDetailResponseDto {
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
  detail: ProductDetailInfoDto | null;
}

export class ProductDetailInfoDto {
  description: string | null;
  specs: Record<string, string>;
  ratingsAvg: number | null;
  reviewsCount: number;
  conditions: ProductConditionDto[];
  inStock: boolean;
}

export class ProductConditionDto {
  type: string;
  label: string;
  price: number;
  available: boolean;
}
