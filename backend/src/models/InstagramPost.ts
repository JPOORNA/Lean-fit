import mongoose, { Schema, Document } from "mongoose";

export interface InstagramPostDocument extends Document {
  thumbnailUrl: string;
  postUrl: string;
  caption: string;
  type: "post" | "reel";
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const instagramPostSchema = new Schema<InstagramPostDocument>(
  {
    thumbnailUrl: { type: String, required: true },
    postUrl: { type: String, required: true },
    caption: { type: String, default: "" },
    type: { type: String, enum: ["post", "reel"], default: "post" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

instagramPostSchema.index({ order: 1 });

export const InstagramPost = mongoose.model<InstagramPostDocument>(
  "InstagramPost",
  instagramPostSchema
);
