import { preferencesSchema, notificationDefaults } from "./Notification";
import mongoose, { Schema, Document, Model } from "mongoose";

import { AppError } from "../utils/errors";

export type Role = "doctor" | "client" | "user";

export interface UserDocument extends Document {
  contactIdentityVersion?: number;
  authVersion: number;
  isGuest: boolean;
  notificationPreferences: typeof notificationDefaults;
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
    contactIdentityVersion: { type: Number },
    authVersion: { type: Number, default: 0 },
    isGuest: { type: Boolean, default: false },
    notificationPreferences: { type: preferencesSchema, default: () => ({}) },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["doctor", "client", "user"], default: "user" },
    isActive: { type: Boolean, default: true },
    timezone: { type: String, default: "UTC" },
    clientExpiresAt: { type: Date },
    refreshTokens: { type: [String], default: [] },
    whatsappNumber: { type: String, trim: true, set: (value: string) => value?.replace(/[\s()-]/g, ""), required: function() { return this.isNew || this.isModified("whatsappNumber"); } }
  },
  { timestamps: true }
);

// Legacy duplicate contacts are preserved. New accounts and contact changes must be unique.
// A partial index enforces concurrent writes without requiring a destructive legacy merge.
userSchema.index({ whatsappNumber: 1 }, {
  unique: true,
  name: "unique_whatsapp_identity",
  partialFilterExpression: { contactIdentityVersion: 1, whatsappNumber: { $type: "string" } }
});
userSchema.pre("validate", async function () {
  if (!this.isNew && !this.isModified("whatsappNumber") && !this.isModified("email")) return;
  const users = this.constructor as Model<UserDocument>;
  if (this.whatsappNumber && await users.exists({ _id: { $ne: this._id }, whatsappNumber: this.whatsappNumber })) {
    throw new AppError("This WhatsApp number is already linked to another account. Use its existing email or contact support.", 409, "WHATSAPP_EXISTS");
  }
  if (this.email && await users.exists({ _id: { $ne: this._id }, email: this.email })) {
    throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
  }
  this.contactIdentityVersion = 1;
});

export const User = mongoose.model<UserDocument>("User", userSchema);
