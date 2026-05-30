import mongoose, { Schema, Document } from "mongoose";

export interface TestimonialDocument extends Document {
  clientName: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  quote: string;
  weightLost: string;
  duration: string;
  rating: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const testimonialSchema = new Schema<TestimonialDocument>(
  {
    clientName: { type: String, required: true, trim: true },
    beforeImageUrl: { type: String, default: "" },
    afterImageUrl: { type: String, default: "" },
    quote: { type: String, required: true },
    weightLost: { type: String, default: "" },
    duration: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testimonialSchema.index({ order: 1 });

export const Testimonial = mongoose.model<TestimonialDocument>(
  "Testimonial",
  testimonialSchema
);
