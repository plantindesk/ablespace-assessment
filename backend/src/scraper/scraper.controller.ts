import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from "@nestjs/common";
import { ScraperService } from "./scraper.service";

@Controller("scraper")
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) { }

  @Get("health")
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    return await this.scraperService.healthCheck();
  }

  @Get("categories")
  async scrapeCategories() {
    const result = await this.scraperService.scrapeCategories();

    if (!result.success) {
      throw new HttpException(
        result.error || "Scraping failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result;
  }

  @Get("category/:slug")
  async scrapeCategory(
    @Param("slug") slug: string,
    @Query("page") page?: string,
  ) {
    const result = await this.scraperService.scrapeCategory(slug, {
      page: page ? parseInt(page, 10) : undefined,
    });

    if (!result.success) {
      throw new HttpException(
        result.error || "Scraping failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result;
  }

  @Get("product/:slug")
  async scrapeProduct(@Param("slug") slug: string) {
    const result = await this.scraperService.scrapeProduct(slug);

    if (!result.success) {
      throw new HttpException(
        result.error || "Scraping failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result;
  }
}
