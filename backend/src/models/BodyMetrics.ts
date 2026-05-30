import mongoose, { Schema, Document } from "mongoose";

export interface BodyMetricsDocument extends Document {
  userId: mongoose.Types.ObjectId;
  weekStartDate: Date;
  weight: number;
  height: number;
  bmi: number;
  extraFields: Record<string, string | number>;
  createdAt: Date;
  updatedAt: Date;
}

const bodyMetricsSchema = new Schema<BodyMetricsDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    weekStartDate: { type: Date, required: true },
    weight: { type: Number, required: true },
    height: { type: Number, required: true },
    bmi: { type: Number, required: true },
    extraFields: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

bodyMetricsSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });

export const BodyMetrics = mongoose.model<BodyMetricsDocument>("BodyMetrics", bodyMetricsSchema);
