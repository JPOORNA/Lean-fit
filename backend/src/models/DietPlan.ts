import mongoose, { Schema, Document } from "mongoose";

export interface DietPlanDocument extends Document {
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

const dietPlanSchema = new Schema<DietPlanDocument>(
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

dietPlanSchema.index({ doctorId: 1 });

dietPlanSchema.index({ assignedTo: 1 });

export const DietPlan = mongoose.model<DietPlanDocument>("DietPlan", dietPlanSchema);
