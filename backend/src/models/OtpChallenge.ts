import mongoose, { Schema } from "mongoose";
const schema = new Schema({
  contactKey: { type: String, required: true, unique: true },
  challengeId: { type: String, required: true, unique: true },
  purpose: { type: String, enum: ["reset", "booking", "register"], required: true },
  identifier: { type: String, required: true },
  channel: { type: String, enum: ["email", "whatsapp"], required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  expiresAt: { type: Date, required: true }, consumedAt: Date,
  createdAt: { type: Date, default: Date.now }
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const OtpChallenge = mongoose.model("OtpChallenge", schema);
