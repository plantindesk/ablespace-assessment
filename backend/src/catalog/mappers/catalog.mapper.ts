import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import type { CategoryDocument } from "../../database/schemas/category.schema";
import type { ProductDocument } from "../../database/schemas/product.schema";
import type { ProductDetailDocument } from "../../database/schemas/product-detail.schema";
import type {
  ProductListItem,
  ProductDetail as ScrapedProductDetail,
} from "../../scraper/scraper.service";
import type {
  CategoryWithProducts,
  ProductSummary,
  ProductWithDetail,
} from "../interfaces/catalog.interfaces";

@Injectable()
export class CatalogMapper {
  mapScrapedProductToBulkOp(
    item: ProductListItem,
    categoryId: Types.ObjectId,
  ): {
    updateOne: {
      filter: { source_id: string };
      update: {
        $set: Record<string, unknown>;
        $addToSet?: Record<string, unknown>;
      };
      upsert: boolean;
    };
  } {
    // Ensure categoryId is a proper ObjectId instance
    const categoryObjectId = new Types.ObjectId(categoryId.toString());

    return {
      updateOne: {
        filter: { source_id: item.sourceId },
        update: {
          $set: {
            source_id: item.sourceId,
            title: item.title,
            price: item.price,
            currency: item.currency,
            image_url: item.imageUrl,
            source_url: item.url,
            last_scraped_at: new Date(),
          },
          $addToSet: {
            category_ids: categoryObjectId,
          },
        },
        upsert: true,
      },
    };
  }

  // ... rest of the file remains unchanged
  mapScrapedDetailToDocument(
    scraped: ScrapedProductDetail,
    productId: Types.ObjectId,
  ): Partial<ProductDetailDocument> {
    return {
      product_id: productId,
      description: scraped.description,
      specs: scraped.specs,
      ratings_avg: null,
      reviews_count: 0,
    };
  }

  mapProductToSummary(doc: ProductDocument): ProductSummary {
    return {
      id: doc._id.toString(),
      sourceId: doc.source_id,
      title: doc.title,
      author: null,
      price: doc.price,
      currency: doc.currency,
      imageUrl: doc.image_url,
      slug: this.extractSlugFromUrl(doc.source_url),
      url: doc.source_url,
      hasDetail: false,
    };
  }

  mapProductWithDetail(
    product: ProductDocument,
    detail: ProductDetailDocument | null,
    scrapedDetail?: ScrapedProductDetail,
  ): ProductWithDetail {
    return {
      id: product._id.toString(),
      sourceId: product.source_id,
      title: product.title,
      author: null,
      price: product.price,
      currency: product.currency,
      imageUrl: product.image_url,
      imageUrls: scrapedDetail?.imageUrls || [],
      slug: this.extractSlugFromUrl(product.source_url),
      url: product.source_url,
      lastScrapedAt: product.last_scraped_at,
      detail: detail
        ? {
          description: detail.description,
          specs: Object.entries(detail.specs).reduce(
            (acc, [key, value]) => {
              acc[key] = String(value);
              return acc;
            },
            {} as Record<string, string>,
          ),
          ratingsAvg: detail.ratings_avg,
          reviewsCount: detail.reviews_count,
          conditions: scrapedDetail?.conditions || [],
          inStock: scrapedDetail?.inStock ?? true,
        }
        : null,
    };
  }

  mapCategoryToResponse(
    category: CategoryDocument,
    products: ProductDocument[],
    pagination: { page: number; limit: number; total: number },
  ): CategoryWithProducts {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    return {
      category: {
        id: category._id.toString(),
        title: category.title,
        slug: category.slug,
        productCount: category.product_count,
        lastScrapedAt: category.last_scraped_at,
      },
      products: {
        items: products.map((p) => this.mapProductToSummary(p)),
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          totalItems: pagination.total,
          totalPages,
          hasNextPage: pagination.page < totalPages,
          hasPrevPage: pagination.page > 1,
        },
      },
    };
  }

  private extractSlugFromUrl(url: string): string {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }
}
