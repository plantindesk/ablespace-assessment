import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Category,
  type CategoryDocument,
} from "../database/schemas/category.schema";
import {
  Navigation,
  type NavigationDocument,
} from "../database/schemas/navigation.schema";
import {
  Product,
  type ProductDocument,
} from "../database/schemas/product.schema";
import {
  ProductDetail,
  type ProductDetailDocument,
} from "../database/schemas/product-detail.schema";
import {
  type ProductListItem,
  type ProductDetail as ScrapedProductDetail,
  ScraperService,
} from "../scraper/scraper.service";
import type {
  CategoryWithProducts,
  PaginationParams,
  ProductWithDetail,
  StalenessConfig,
} from "./interfaces/catalog.interfaces";
import { CatalogMapper } from "./mappers/catalog.mapper";

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  private readonly stalenessConfig: StalenessConfig = {
    categoryMaxAgeMs: 24 * 60 * 60 * 1000,
    productMaxAgeMs: 24 * 60 * 60 * 1000,
  };

  constructor(
    @InjectModel(Navigation.name)
    private readonly navigationModel: Model<NavigationDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductDetail.name)
    private readonly productDetailModel: Model<ProductDetailDocument>,
    private readonly scraperService: ScraperService,
    private readonly mapper: CatalogMapper,
  ) { }

  async getAllCategories(): Promise<CategoryDocument[]> {
    const count = await this.categoryModel.countDocuments().exec();

    if (count === 0) {
      this.logger.log(
        "Database empty. Seeding categories from World of Books...",
      );
      await this.scrapeAndSaveAllCategories();
    }

    return await this.categoryModel.find().sort({ title: 1 }).exec();
  }

  async getCategory(
    slug: string,
    pagination: PaginationParams = { page: 1, limit: 20 },
  ): Promise<CategoryWithProducts> {
    this.logger.log(`Getting category: ${slug}`);

    let category = await this.categoryModel.findOne({ slug }).exec();

    const needsScraping = this.categoryNeedsScraping(category);

    if (needsScraping) {
      if (!category) {
        this.logger.log(
          `Category "${slug}" not found in DB, attempting on-demand scrape.`,
        );
      } else {
        this.logger.log(`Category "${slug}" needs scraping (Stale)`);
      }

      await this.scrapeAndSaveCategory(slug, category?._id);

      category = await this.categoryModel.findOne({ slug }).exec();
    }

    if (!category) {
      throw new NotFoundException(
        `Category "${slug}" not found after attempting to scrape`,
      );
    }

    const { products, total } = await this.getProductsForCategory(
      category._id,
      pagination,
    );

    return this.mapper.mapCategoryToResponse(category, products, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  }
  private async scrapeAndSaveAllCategories(): Promise<void> {
    const result = await this.scraperService.scrapeCategories();

    if (!result.success || !result.data || result.data.length === 0) {
      this.logger.error(`Failed to seed categories: ${result.error}`);
      return;
    }

    const navId = await this.getOrCreateDefaultNavigation();
    const categoriesData = result.data;

    const bulkOps = categoriesData.map((cat) => ({
      updateOne: {
        filter: { slug: cat.slug },
        update: {
          $set: {
            title: cat.title,
            slug: cat.slug,
            navigation_id: navId,
            last_scraped_at: new Date(),
          },
          $setOnInsert: {
            product_count: 0,
            parent_id: null,
          },
        },
        upsert: true,
      },
    }));

    try {
      await this.categoryModel.bulkWrite(bulkOps);
      this.logger.log(`Successfully seeded ${bulkOps.length} categories.`);
    } catch (e) {
      this.logger.error(`Bulk write failed: ${e}`);
    }
  }

  private async scrapeAndSaveCategory(
    slug: string,
    existingCategoryId?: Types.ObjectId,
  ): Promise<void> {
    const scrapeResult = await this.scraperService.scrapeCategory(slug);

    if (!scrapeResult.success || !scrapeResult.data) {
      this.logger.error(
        `Failed to scrape category "${slug}": ${scrapeResult.error}`,
      );
      if (!existingCategoryId) {
        throw new InternalServerErrorException(
          `Failed to scrape category "${slug}" and no cached data available`,
        );
      }
      this.logger.warn(
        `Using stale data for category "${slug}" due to scrape failure`,
      );
      return;
    }

    const scrapedProducts = scrapeResult.data;
    this.logger.log(`Scraped ${scrapedProducts.length} products for "${slug}"`);

    const category = await this.upsertCategory(slug, scrapedProducts.length);

    if (scrapedProducts.length > 0) {
      await this.bulkUpsertProducts(scrapedProducts, category._id);
    }

    await this.categoryModel.updateOne(
      { _id: category._id },
      {
        $set: {
          last_scraped_at: new Date(),
          product_count: scrapedProducts.length,
        },
      },
    );
  }

  private categoryNeedsScraping(category: CategoryDocument | null): boolean {
    if (!category) return true;
    if (!category.last_scraped_at) return true;

    const age = Date.now() - category.last_scraped_at.getTime();
    return age > this.stalenessConfig.categoryMaxAgeMs;
  }

  private async upsertCategory(
    slug: string,
    productCount: number,
  ): Promise<CategoryDocument> {
    const result = await this.categoryModel.findOneAndUpdate(
      { slug },
      {
        $set: {
          slug,
          title: this.slugToTitle(slug),
          product_count: productCount,
        },
        $setOnInsert: {
          navigation_id: await this.getOrCreateDefaultNavigation(),
          parent_id: null,
        },
      },
      { upsert: true, new: true },
    );
    return result;
  }

  private async getOrCreateDefaultNavigation(): Promise<Types.ObjectId> {
    const defaultNav = await this.navigationModel.findOneAndUpdate(
      { slug: "all-categories" },
      {
        $setOnInsert: {
          title: "All Categories",
          slug: "all-categories",
        },
      },
      { upsert: true, new: true },
    );
    return defaultNav._id;
  }

  private async bulkUpsertProducts(
    products: ProductListItem[],
    categoryId: Types.ObjectId,
  ): Promise<void> {
    if (products.length === 0) return;

    const bulkOps = products.map((product) =>
      this.mapper.mapScrapedProductToBulkOp(product, categoryId),
    );

    try {
      const result = await this.productModel.bulkWrite(bulkOps, {
        ordered: false,
      });
      this.logger.log(
        `Bulk upsert: ${result.upsertedCount} inserted, ${result.modifiedCount} modified`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Bulk upsert error: ${errorMessage}`);
    }
  }

  private async getProductsForCategory(
    categoryId: Types.ObjectId,
    pagination: PaginationParams,
  ): Promise<{ products: ProductDocument[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;
    const categoryObjectId = new Types.ObjectId(categoryId.toString());

    const [products, total] = await Promise.all([
      this.productModel
        .find({ category_ids: categoryObjectId })
        .sort({ last_scraped_at: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .exec(),
      this.productModel
        .countDocuments({ category_ids: categoryObjectId })
        .exec(),
    ]);

    return { products, total };
  }

  async getProduct(slug: string): Promise<ProductWithDetail> {
    this.logger.log(`Getting product: ${slug}`);

    let product = await this.findProductBySlug(slug);

    if (!product) {
      this.logger.log(`Product "${slug}" not in DB, scraping...`);
      product = await this.scrapeAndSaveProduct(slug);
      if (!product) {
        throw new NotFoundException(`Product "${slug}" not found`);
      }
    }

    let detail: ProductDetailDocument | null = await this.productDetailModel
      .findOne({ product_id: product._id })
      .exec();

    const detailNeedsScraping = this.productDetailNeedsScraping(
      detail,
      product,
    );

    let scrapedDetail: ScrapedProductDetail | undefined;

    if (detailNeedsScraping) {
      this.logger.log(`Product detail for "${slug}" needs scraping`);
      const scrapeResult = await this.scraperService.scrapeProduct(slug);
      if (scrapeResult.success && scrapeResult.data) {
        scrapedDetail = scrapeResult.data;
        detail = await this.saveProductDetail(product._id, scrapedDetail);
        await this.updateProductFromDetail(product._id, scrapedDetail);

        product = await this.productModel.findById(product._id).exec();
      } else {
        this.logger.warn(`Failed to scrape product detail for "${slug}"`);
      }
    }

    if (!product) throw new NotFoundException(`Product "${slug}" not found`);

    return this.mapper.mapProductWithDetail(product, detail, scrapedDetail);
  }

  private async findProductBySlug(
    slug: string,
  ): Promise<ProductDocument | null> {
    const product = await this.productModel
      .findOne({
        source_url: { $regex: `/${slug}$` },
      })
      .exec();
    return product;
  }

  private productDetailNeedsScraping(
    detail: ProductDetailDocument | null,
    product: ProductDocument,
  ): boolean {
    if (!detail) return true;
    if (!product.last_scraped_at) return true;

    const age = Date.now() - product.last_scraped_at.getTime();
    return age > this.stalenessConfig.productMaxAgeMs;
  }

  private async scrapeAndSaveProduct(
    slug: string,
  ): Promise<ProductDocument | null> {
    const scrapeResult = await this.scraperService.scrapeProduct(slug);
    if (!scrapeResult.success || !scrapeResult.data) {
      this.logger.error(
        `Failed to scrape product "${slug}": ${scrapeResult.error}`,
      );
      return null;
    }

    const scrapedData = scrapeResult.data;
    const product = await this.productModel.create({
      source_id: scrapedData.sourceId,
      title: scrapedData.title,
      price: scrapedData.price,
      currency: scrapedData.currency,
      image_url: scrapedData.imageUrl,
      source_url: scrapedData.url,
      last_scraped_at: new Date(),
    });

    await this.saveProductDetail(product._id, scrapedData);
    return product;
  }

  private async saveProductDetail(
    productId: Types.ObjectId,
    scrapedDetail: ScrapedProductDetail,
  ): Promise<ProductDetailDocument> {
    const detailData = this.mapper.mapScrapedDetailToDocument(
      scrapedDetail,
      productId,
    );
    const detail = await this.productDetailModel.findOneAndUpdate(
      { product_id: productId },
      {
        $set: {
          ...detailData,
          product_id: productId,
        },
      },
      { upsert: true, new: true },
    );
    return detail;
  }

  private async updateProductFromDetail(
    productId: Types.ObjectId,
    scrapedDetail: ScrapedProductDetail,
  ): Promise<void> {
    await this.productModel.updateOne(
      { _id: productId },
      {
        $set: {
          title: scrapedDetail.title,
          price: scrapedDetail.price,
          currency: scrapedDetail.currency,
          image_url: scrapedDetail.imageUrl,
          last_scraped_at: new Date(),
        },
      },
    );
  }

  async searchProducts(
    query: string,
    pagination: PaginationParams = { page: 1, limit: 20 },
  ): Promise<{ products: ProductDocument[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;
    const searchFilter = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { source_id: { $regex: query, $options: "i" } },
      ],
    };

    const [products, total] = await Promise.all([
      this.productModel
        .find(searchFilter)
        .sort({ last_scraped_at: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .exec(),
      this.productModel.countDocuments(searchFilter).exec(),
    ]);

    return { products, total };
  }

  async refreshCategory(slug: string): Promise<CategoryWithProducts> {
    this.logger.log(`Force refreshing category: ${slug}`);
    const existingCategory = await this.categoryModel.findOne({ slug }).exec();
    await this.scrapeAndSaveCategory(slug, existingCategory?._id);
    return this.getCategory(slug);
  }

  async refreshProduct(slug: string): Promise<ProductWithDetail> {
    this.logger.log(`Force refreshing product: ${slug}`);
    const product = await this.findProductBySlug(slug);
    if (product) {
      await this.productDetailModel.deleteOne({ product_id: product._id });
    }
    return this.getProduct(slug);
  }

  private slugToTitle(slug: string): string {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
