import mongoose, { Schema, Document } from "mongoose";

export interface ServiceDocument extends Document {
  title: string;
  description: string;
  imageUrl: string;
  benefits: string[];
  iconName: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<ServiceDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    benefits: [{ type: String }],
    iconName: { type: String, required: true },
    color: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

serviceSchema.index({ order: 1 });
serviceSchema.index({ isActive: 1 });

export const Service = mongoose.model<ServiceDocument>("Service", serviceSchema);
