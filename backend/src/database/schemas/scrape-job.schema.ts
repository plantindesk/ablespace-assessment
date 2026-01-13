import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ScrapeJobDocument = HydratedDocument<ScrapeJob>;

export enum TargetType {
  NAVIGATION = "navigation",
  CATEGORY = "category",
  PRODUCT = "product",
  SITEMAP = "sitemap",
}

export enum JobStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

@Schema({
  timestamps: true,
  collection: "scrape_jobs",
})
export class ScrapeJob {
  @Prop({
    type: String,
    required: true,
    index: true,
  })
  target_url: string;

  @Prop({
    type: String,
    enum: Object.values(TargetType),
    required: true,
    index: true,
  })
  target_type: TargetType;

  @Prop({
    type: String,
    enum: Object.values(JobStatus),
    default: JobStatus.PENDING,
    index: true,
  })
  status: JobStatus;

  @Prop({
    type: Date,
    default: null,
  })
  started_at: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  finished_at: Date | null;

  @Prop({
    type: String,
    default: null,
  })
  error_log: string | null;
}

export const ScrapeJobSchema = SchemaFactory.createForClass(ScrapeJob);

ScrapeJobSchema.index({ status: 1, started_at: 1 });
ScrapeJobSchema.index({ target_type: 1, status: 1 });
ScrapeJobSchema.index({ target_url: 1, status: 1 });
