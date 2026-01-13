import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ReviewDocument = HydratedDocument<Review>;

@Schema({
  timestamps: false,
  collection: "reviews",
})
export class Review {
  @Prop({
    type: Types.ObjectId,
    ref: "Product",
    required: true,
    index: true,
  })
  product_id: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  author: string;

  @Prop({
    type: Number,
    required: true,
    min: 1,
    max: 5,
  })
  rating: number;

  @Prop({
    type: String,
    required: true,
  })
  text: string;

  @Prop({
    type: Date,
    required: true,
    index: true,
  })
  created_at: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ product_id: 1, created_at: -1 });
ReviewSchema.index({ product_id: 1, rating: 1 });
