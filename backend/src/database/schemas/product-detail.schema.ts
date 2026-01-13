import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProductDetailDocument = HydratedDocument<ProductDetail>;

@Schema({
  timestamps: true,
  collection: "product_details",
})
export class ProductDetail {
  @Prop({
    type: Types.ObjectId,
    ref: "Product",
    required: true,
    unique: true,
    index: true,
  })
  product_id: Types.ObjectId;

  @Prop({
    type: String,
    default: null,
  })
  description: string | null;

  @Prop({
    type: Object,
    default: {},
  })
  specs: Record<string, string | number | boolean>;

  @Prop({
    type: Number,
    default: null,
    min: 0,
    max: 5,
  })
  ratings_avg: number | null;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  reviews_count: number;
}

export const ProductDetailSchema = SchemaFactory.createForClass(ProductDetail);
