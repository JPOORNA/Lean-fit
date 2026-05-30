import mongoose, { Schema, Document } from "mongoose";

export interface ContactMessageDocument extends Document {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<ContactMessageDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

export const ContactMessage = mongoose.model<ContactMessageDocument>(
  "ContactMessage",
  contactMessageSchema
);
