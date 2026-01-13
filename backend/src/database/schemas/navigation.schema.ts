import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type NavigationDocument = HydratedDocument<Navigation>;

@Schema({
  timestamps: true,
  collection: "navigations",
})
export class Navigation {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  title: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  slug: string;

  @Prop({
    type: Date,
    default: null,
    index: true,
  })
  last_scraped_at: Date | null;
}

export const NavigationSchema = SchemaFactory.createForClass(Navigation);
