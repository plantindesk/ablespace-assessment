import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  timestamps: true,
  collection: "products",
})
export class Product {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  source_id: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  title: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    type: String,
    required: true,
    default: "GBP",
    uppercase: true,
    maxlength: 3,
  })
  currency: string;

  @Prop({
    type: String,
    default: null,
  })
  image_url: string | null;

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  source_url: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: "Category" }],
    default: [],
    index: true,
  })
  category_ids: Types.ObjectId[];

  @Prop({
    type: Date,
    default: null,
    index: true,
  })
  last_scraped_at: Date | null;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Compound indexes for common queries
ProductSchema.index({ category_ids: 1, last_scraped_at: -1 });
ProductSchema.index({ source_url: 1 });
