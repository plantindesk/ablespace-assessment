import {
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Types } from "mongoose";
import { type CategoryDocument } from "../database/schemas/category.schema";
import { type ProductDocument } from "../database/schemas/product.schema";
import {
  type ProductListItem,
  ScraperService,
} from "../scraper/scraper.service";
import { CatalogService } from "./catalog.service";
import type {
  CategoryWithProducts,
  PaginationParams,
} from "./interfaces/catalog.interfaces";
import { CatalogMapper } from "./mappers/catalog.mapper";

const mockModel = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  bulkWrite: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn(),
});

describe("CatalogService", () => {
  let service: CatalogService;
  let navigationModel: Record<string, jest.Mock>;
  let categoryModel: Record<string, jest.Mock>;
  let productModel: Record<string, jest.Mock>;
  let productDetailModel: Record<string, jest.Mock>;
  let scraperService: Record<string, jest.Mock>;
  let mapper: Record<string, jest.Mock>;

  beforeEach(async () => {
    navigationModel = mockModel();
    categoryModel = mockModel();
    productModel = mockModel();
    productDetailModel = mockModel();

    scraperService = {
      scrapeCategories: jest.fn(),
      scrapeCategory: jest.fn(),
      scrapeProduct: jest.fn(),
    };

    mapper = {
      mapCategoryToResponse: jest.fn(),
      mapScrapedProductToBulkOp: jest.fn(),
      mapProductWithDetail: jest.fn(),
      mapScrapedDetailToDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: "NavigationModel", useValue: navigationModel },
        { provide: "CategoryModel", useValue: categoryModel },
        { provide: "ProductModel", useValue: productModel },
        { provide: "ProductDetailModel", useValue: productDetailModel },
        { provide: ScraperService, useValue: scraperService },
        { provide: CatalogMapper, useValue: mapper },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  describe("getCategory", () => {
    const slug = "test-category";
    const pagination: PaginationParams = { page: 1, limit: 20 };

    const mockCategory: CategoryDocument = {
      _id: new Types.ObjectId(),
      title: "Test Category",
      slug,
      navigation_id: new Types.ObjectId(),
      product_count: 5,
      parent_id: null,
      last_scraped_at: new Date(),
    } as CategoryDocument;

    const mockProducts: ProductDocument[] = [
      {
        _id: new Types.ObjectId(),
        source_id: "123",
        title: "Product 1",
        price: 10.99,
        currency: "GBP",
        image_url: "http://example.com/img.jpg",
        source_url: "http://example.com/product-1",
        category_ids: [mockCategory._id],
        last_scraped_at: new Date(),
      } as ProductDocument,
    ];

    const mockMappedResponse: CategoryWithProducts = {
      category: {
        id: mockCategory._id.toString(),
        title: mockCategory.title,
        slug: mockCategory.slug,
        productCount: mockCategory.product_count,
        lastScrapedAt: mockCategory.last_scraped_at,
      },
      products: {
        items: mockProducts.map((p) => ({
          id: p._id.toString(),
          sourceId: p.source_id,
          title: p.title,
          author: null,
          price: p.price,
          currency: p.currency,
          imageUrl: p.image_url,
          slug: p.source_url.split("/").pop() || "",
          url: p.source_url,
          hasDetail: false,
        })),
        pagination: {
          page: 1,
          limit: 20,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    };

    describe("Fresh Cache scenario", () => {
      it("should NOT call scraperService.scrapeCategory when cache is fresh (last_scraped_at 1 minute ago)", async () => {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const freshCategory = {
          ...mockCategory,
          last_scraped_at: oneMinuteAgo,
        };

        categoryModel.findOne.mockResolvedValue(freshCategory);
        productModel.find.mockResolvedValue(mockProducts);
        productModel.countDocuments.mockResolvedValue(1);
        mapper.mapCategoryToResponse.mockReturnValue(mockMappedResponse);

        const result = await service.getCategory(slug, pagination);

        expect(scraperService.scrapeCategory).not.toHaveBeenCalled();
        expect(result).toEqual(mockMappedResponse);
        expect(categoryModel.findOne).toHaveBeenCalledTimes(1);
      });
    });

    describe("Stale Cache scenario", () => {
      it("should call scraperService.scrapeCategory when cache is stale (last_scraped_at 48 hours ago)", async () => {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const staleCategory = {
          ...mockCategory,
          last_scraped_at: fortyEightHoursAgo,
        };

        const scrapedProducts: ProductListItem[] = [
          {
            sourceId: "123",
            title: "Product 1",
            author: "Author",
            price: 10.99,
            currency: "GBP",
            imageUrl: "http://example.com/img.jpg",
            url: "http://example.com/product-1",
            slug: "product-1",
          },
        ];

        const updatedCategory = {
          ...staleCategory,
          last_scraped_at: new Date(),
        };

        scraperService.scrapeCategory.mockResolvedValue({
          success: true,
          data: scrapedProducts,
        });

        categoryModel.findOne
          .mockResolvedValueOnce(staleCategory)
          .mockResolvedValueOnce(updatedCategory);

        navigationModel.findOneAndUpdate.mockResolvedValue({
          _id: new Types.ObjectId(),
        });

        categoryModel.findOneAndUpdate.mockResolvedValue(updatedCategory);
        productModel.bulkWrite.mockResolvedValue({
          upsertedCount: 1,
          modifiedCount: 0,
        });

        categoryModel.updateOne.mockResolvedValue({ acknowledged: true });

        productModel.find.mockResolvedValue(mockProducts);
        productModel.countDocuments.mockResolvedValue(1);
        mapper.mapCategoryToResponse.mockReturnValue(mockMappedResponse);

        const result = await service.getCategory(slug, pagination);

        expect(scraperService.scrapeCategory).toHaveBeenCalledWith(slug);
        expect(scraperService.scrapeCategory).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockMappedResponse);
      });

      it("should await scrape and return fresh data after successful scrape of stale cache", async () => {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const staleCategory = {
          ...mockCategory,
          last_scraped_at: fortyEightHoursAgo,
        };

        const scrapedProducts: ProductListItem[] = [
          {
            sourceId: "456",
            title: "New Product",
            author: "New Author",
            price: 15.99,
            currency: "GBP",
            imageUrl: "http://example.com/new.jpg",
            url: "http://example.com/new-product",
            slug: "new-product",
          },
        ];

        const updatedCategory = {
          ...staleCategory,
          last_scraped_at: new Date(),
          product_count: scrapedProducts.length,
        };

        const newProducts: ProductDocument[] = [
          {
            _id: new Types.ObjectId(),
            source_id: scrapedProducts[0].sourceId,
            title: scrapedProducts[0].title,
            price: scrapedProducts[0].price,
            currency: scrapedProducts[0].currency,
            image_url: scrapedProducts[0].imageUrl,
            source_url: scrapedProducts[0].url,
            category_ids: [updatedCategory._id],
            last_scraped_at: new Date(),
          } as ProductDocument,
        ];

        scraperService.scrapeCategory.mockResolvedValue({
          success: true,
          data: scrapedProducts,
        });

        categoryModel.findOne
          .mockResolvedValueOnce(staleCategory)
          .mockResolvedValueOnce(updatedCategory);

        navigationModel.findOneAndUpdate.mockResolvedValue({
          _id: new Types.ObjectId(),
        });

        categoryModel.findOneAndUpdate.mockResolvedValue(updatedCategory);

        const mockBulkOp = {
          updateOne: {
            filter: { source_id: scrapedProducts[0].sourceId },
            update: { $set: {} },
            upsert: true,
          },
        };

        mapper.mapScrapedProductToBulkOp.mockReturnValue(mockBulkOp.updateOne);

        productModel.bulkWrite.mockResolvedValue({
          upsertedCount: 1,
          modifiedCount: 0,
        });

        categoryModel.updateOne.mockResolvedValue({ acknowledged: true });

        productModel.find.mockResolvedValue(newProducts);
        productModel.countDocuments.mockResolvedValue(1);

        const newMappedResponse = {
          ...mockMappedResponse,
          products: {
            items: newProducts.map((p) => ({
              id: p._id.toString(),
              sourceId: p.source_id,
              title: p.title,
              author: null,
              price: p.price,
              currency: p.currency,
              imageUrl: p.image_url,
              slug: p.source_url.split("/").pop() || "",
              url: p.source_url,
              hasDetail: false,
            })),
            pagination: {
              page: 1,
              limit: 20,
              totalItems: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
        };

        mapper.mapCategoryToResponse.mockReturnValue(newMappedResponse);

        const result = await service.getCategory(slug, pagination);

        expect(result).toEqual(newMappedResponse);
        expect(result.products.items[0].title).toBe("New Product");
      });
    });

    describe("Empty DB scenario", () => {
      it("should throw NotFoundException when findOne returns null and scrape fails", async () => {
        categoryModel.findOne.mockResolvedValue(null);

        scraperService.scrapeCategory.mockResolvedValue({
          success: false,
          error: "Category not found",
        });

        await expect(service.getCategory(slug, pagination)).rejects.toThrow(
          InternalServerErrorException,
        );
        await expect(service.getCategory(slug, pagination)).rejects.toThrow(
          `Failed to scrape category "${slug}" and no cached data available`,
        );

        expect(scraperService.scrapeCategory).toHaveBeenCalledWith(slug);
      });

      it("should throw NotFoundException when scrape fails for new category", async () => {
        categoryModel.findOne.mockResolvedValue(null);

        scraperService.scrapeCategory.mockResolvedValue({
          success: false,
          error: "404 Not Found",
        });

        await expect(service.getCategory(slug, pagination)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });

    describe("Edge cases", () => {
      it("should throw NotFoundException when category not found after scrape attempt", async () => {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const staleCategory = {
          ...mockCategory,
          last_scraped_at: fortyEightHoursAgo,
        };

        categoryModel.findOne
          .mockResolvedValueOnce(staleCategory)
          .mockResolvedValueOnce(null);

        navigationModel.findOneAndUpdate.mockResolvedValue({
          _id: new Types.ObjectId(),
        });

        categoryModel.findOneAndUpdate.mockResolvedValue(null);

        scraperService.scrapeCategory.mockResolvedValue({
          success: true,
          data: [],
        });

        productModel.bulkWrite.mockResolvedValue({
          upsertedCount: 0,
          modifiedCount: 0,
        });

        categoryModel.updateOne.mockResolvedValue({ acknowledged: true });

        await expect(service.getCategory(slug, pagination)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.getCategory(slug, pagination)).rejects.toThrow(
          `Category "${slug}" not found after attempting to scrape`,
        );
      });

      it("should throw NotFoundException when category has no last_scraped_at", async () => {
        const categoryWithoutTimestamp = {
          ...mockCategory,
          last_scraped_at: undefined,
        };

        categoryModel.findOne.mockResolvedValue(categoryWithoutTimestamp);

        scraperService.scrapeCategory.mockResolvedValue({
          success: false,
          error: "Scrape failed",
        });

        await expect(service.getCategory(slug, pagination)).rejects.toThrow(
          InternalServerErrorException,
        );

        expect(scraperService.scrapeCategory).toHaveBeenCalledWith(slug);
      });

      it("should handle scrape failure for existing category (stale data fallback)", async () => {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const staleCategory = {
          ...mockCategory,
          last_scraped_at: fortyEightHoursAgo,
        };

        categoryModel.findOne
          .mockResolvedValueOnce(staleCategory)
          .mockResolvedValueOnce(staleCategory);

        scraperService.scrapeCategory.mockResolvedValue({
          success: false,
          error: "Network error",
        });

        productModel.find.mockResolvedValue(mockProducts);
        productModel.countDocuments.mockResolvedValue(1);
        mapper.mapCategoryToResponse.mockReturnValue(mockMappedResponse);

        const result = await service.getCategory(slug, pagination);

        expect(result).toEqual(mockMappedResponse);
        expect(scraperService.scrapeCategory).toHaveBeenCalledWith(slug);
      });

      it("should handle pagination correctly", async () => {
        const freshCategory = {
          ...mockCategory,
          last_scraped_at: new Date(),
        };

        const customPagination: PaginationParams = {
          page: 2,
          limit: 10,
        };

        categoryModel.findOne.mockResolvedValue(freshCategory);
        productModel.find.mockResolvedValue([]);
        productModel.countDocuments.mockResolvedValue(25);
        mapper.mapCategoryToResponse.mockReturnValue({
          ...mockMappedResponse,
          products: {
            items: [],
            pagination: {
              page: 2,
              limit: 10,
              totalItems: 25,
              totalPages: 3,
              hasNextPage: true,
              hasPrevPage: true,
            },
          },
        });

        await service.getCategory(slug, customPagination);

        expect(productModel.find).toHaveBeenCalledWith(expect.any(Object));
        expect(productModel.find).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: { last_scraped_at: -1 },
            skip: 10,
            limit: 10,
          }),
        );
      });
    });
  });
});
