import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { PaginationQueryDto } from "./dto/pagination.dto";
import type {
  CategoryWithProducts,
  ProductWithDetail,
} from "./interfaces/catalog.interfaces";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) { }

  /**
   * GET /catalog/categories
   * List all categories from database
   */
  @Get("categories")
  async getAllCategories() {
    const categories = await this.catalogService.getAllCategories();

    return {
      success: true,
      data: categories.map((cat) => ({
        id: cat._id.toString(),
        title: cat.title,
        slug: cat.slug,
        productCount: cat.product_count,
        lastScrapedAt: cat.last_scraped_at,
      })),
    };
  }

  /**
   * GET /catalog/category/:slug
   * Get category with paginated products
   * Auto-scrapes if data is stale or missing
   */
  @Get("category/:slug")
  async getCategory(
    @Param("slug") slug: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<{ success: boolean; data: CategoryWithProducts }> {
    const result = await this.catalogService.getCategory(slug, {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * POST /catalog/category/:slug/refresh
   * Force refresh category data
   */
  @Post("category/:slug/refresh")
  @HttpCode(HttpStatus.OK)
  async refreshCategory(
    @Param("slug") slug: string,
  ): Promise<{ success: boolean; data: CategoryWithProducts }> {
    const result = await this.catalogService.refreshCategory(slug);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /catalog/product/:slug
   * Get product with full details
   * Auto-scrapes detail if missing
   */
  @Get("product/:slug")
  async getProduct(
    @Param("slug") slug: string,
  ): Promise<{ success: boolean; data: ProductWithDetail }> {
    const result = await this.catalogService.getProduct(slug);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * POST /catalog/product/:slug/refresh
   * Force refresh product data
   */
  @Post("product/:slug/refresh")
  @HttpCode(HttpStatus.OK)
  async refreshProduct(
    @Param("slug") slug: string,
  ): Promise<{ success: boolean; data: ProductWithDetail }> {
    const result = await this.catalogService.refreshProduct(slug);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /catalog/search
   * Search products by title
   */
  @Get("search")
  async searchProducts(
    @Query("q") query: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: pagination.limit ?? 20,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      };
    }

    const { products, total } = await this.catalogService.searchProducts(
      query.trim(),
      {
        page: pagination.page ?? 1,
        limit: pagination.limit ?? 20,
      },
    );

    const totalPages = Math.ceil(total / (pagination.limit ?? 20));
    const currentPage = pagination.page ?? 1;

    return {
      success: true,
      data: {
        items: products.map((p) => ({
          id: p._id.toString(),
          sourceId: p.source_id,
          title: p.title,
          price: p.price,
          currency: p.currency,
          imageUrl: p.image_url,
          url: p.source_url,
        })),
        pagination: {
          page: currentPage,
          limit: pagination.limit ?? 20,
          totalItems: total,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
      },
    };
  }
}
