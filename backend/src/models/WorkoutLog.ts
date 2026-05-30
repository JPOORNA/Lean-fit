import mongoose, { Schema, Document } from "mongoose";

export interface WorkoutLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  attended: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workoutLogSchema = new Schema<WorkoutLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    attended: { type: Boolean, default: false },
    notes: { type: String }
  },
  { timestamps: true }
);

workoutLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const WorkoutLog = mongoose.model<WorkoutLogDocument>("WorkoutLog", workoutLogSchema);
