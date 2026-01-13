import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type CategoryDocument = HydratedDocument<Category>;

@Schema({
  timestamps: true,
  collection: "categories",
})
export class Category {
  @Prop({
    type: Types.ObjectId,
    ref: "Navigation",
    required: true,
    index: true,
  })
  navigation_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: "Category",
    default: null,
    index: true,
  })
  parent_id: Types.ObjectId | null;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  title: string;

  @Prop({
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  slug: string;

  @Prop({
    type: Number,
    default: 0,
  })
  product_count: number;

  @Prop({
    type: Date,
    default: null,
    index: true,
  })
  last_scraped_at: Date | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Compound indexes
CategorySchema.index({ navigation_id: 1, slug: 1 }, { unique: true });
CategorySchema.index({ parent_id: 1, slug: 1 });
