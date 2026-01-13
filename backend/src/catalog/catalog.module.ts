import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DatabaseModule } from "src/database/database.module";
import { Category, CategorySchema } from "../database/schemas/category.schema";
import {
  Navigation,
  NavigationSchema,
} from "../database/schemas/navigation.schema";
import { Product, ProductSchema } from "../database/schemas/product.schema";
import {
  ProductDetail,
  ProductDetailSchema,
} from "../database/schemas/product-detail.schema";
import { ScraperModule } from "../scraper/scraper.module";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { CatalogMapper } from "./mappers/catalog.mapper";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Navigation.name, schema: NavigationSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductDetail.name, schema: ProductDetailSchema },
    ]),
    DatabaseModule,
    ScraperModule,
  ],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogMapper],
  exports: [CatalogService],
})
export class CatalogModule { }
