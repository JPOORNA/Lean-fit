import mongoose, { Schema, Document } from "mongoose";

export type Role = "doctor" | "client" | "user";

export interface UserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  timezone: string;
  clientExpiresAt?: Date;
  refreshTokens: string[];
  whatsappNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["doctor", "client", "user"], default: "user" },
    isActive: { type: Boolean, default: true },
    timezone: { type: String, default: "UTC" },
    clientExpiresAt: { type: Date },
    refreshTokens: { type: [String], default: [] },
    whatsappNumber: { type: String, default: "" }
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>("User", userSchema);
