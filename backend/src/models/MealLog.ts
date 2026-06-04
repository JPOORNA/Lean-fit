import mongoose, { Schema, Document } from "mongoose";

export interface MealLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  imageUrl: string;
  notes?: string;
  takenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mealLogSchema = new Schema<MealLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    notes: { type: String },
    takenAt: { type: Date, required: true }
  },
  { timestamps: true }
);

mealLogSchema.index({ userId: 1, takenAt: -1 });

export const MealLog = mongoose.model<MealLogDocument>("MealLog", mealLogSchema);
