import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ViewHistoryDocument = HydratedDocument<ViewHistory>;

/**
 * Individual path entry in browsing journey
 */
export class PathEntry {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ default: null })
  duration_ms: number | null;
}

@Schema({
  timestamps: true,
  collection: "view_histories",
})
export class ViewHistory {
  @Prop({
    type: Types.ObjectId,
    ref: "User",
    default: null,
    index: true,
  })
  user_id: Types.ObjectId | null;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  session_id: string;

  @Prop({
    type: [PathEntry],
    default: [],
  })
  path_json: PathEntry[];

  @Prop({
    type: Date,
    default: () => new Date(),
    index: true,
  })
  created_at: Date;
}

export const ViewHistorySchema = SchemaFactory.createForClass(ViewHistory);

// Compound index for user journey analysis
ViewHistorySchema.index({ user_id: 1, created_at: -1 });
ViewHistorySchema.index({ session_id: 1, created_at: -1 });

// TTL index - auto-delete after 90 days (optional)
ViewHistorySchema.index({ created_at: 1 }, { expireAfterSeconds: 7776000 });
