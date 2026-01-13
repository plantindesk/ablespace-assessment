import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  Category,
  CategorySchema,
  Navigation,
  NavigationSchema,
  Product,
  ProductDetail,
  ProductDetailSchema,
  ProductSchema,
  Review,
  ReviewSchema,
  ScrapeJob,
  ScrapeJobSchema,
  ViewHistory,
  ViewHistorySchema,
} from "./schemas";

const schemas = [
  { name: Navigation.name, schema: NavigationSchema },
  { name: Category.name, schema: CategorySchema },
  { name: Product.name, schema: ProductSchema },
  { name: ProductDetail.name, schema: ProductDetailSchema },
  { name: Review.name, schema: ReviewSchema },
  { name: ScrapeJob.name, schema: ScrapeJobSchema },
  { name: ViewHistory.name, schema: ViewHistorySchema },
];

@Module({
  imports: [MongooseModule.forFeature(schemas)],
  exports: [MongooseModule],
})
export class DatabaseModule { }
