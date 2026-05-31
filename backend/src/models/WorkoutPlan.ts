import mongoose, { Schema, Document } from "mongoose";

export interface WorkoutPlanDocument extends Document {
  doctorId: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  name?: string;
  description?: string;
  fileUrl: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workoutPlanSchema = new Schema<WorkoutPlanDocument>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String },
    description: { type: String },
    fileUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  { timestamps: true }
);

workoutPlanSchema.index({ doctorId: 1 });

workoutPlanSchema.index({ assignedTo: 1 });

// Unique index removed to allow multiple active workout plans

export const WorkoutPlan = mongoose.model<WorkoutPlanDocument>("WorkoutPlan", workoutPlanSchema);
