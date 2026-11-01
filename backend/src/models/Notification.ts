import mongoose, { Schema } from "mongoose";

export const notificationEvents = ["bookingConfirmation", "bookingReminder", "subscriptionExpiry", "mealUpload"] as const;
export type NotificationEvent = typeof notificationEvents[number];
export const notificationDefaults = {
  email: true, whatsapp: true, bookingConfirmation: true, bookingReminder: true,
  subscriptionExpiry: true, mealUpload: true, bookingReminderMinutes: 60, subscriptionReminderDays: 3
};
export const preferencesSchema = new Schema({
  email: { type: Boolean, default: true }, whatsapp: { type: Boolean, default: true },
  bookingConfirmation: { type: Boolean, default: true }, bookingReminder: { type: Boolean, default: true },
  subscriptionExpiry: { type: Boolean, default: true }, mealUpload: { type: Boolean, default: true },
  bookingReminderMinutes: { type: Number, default: 60 }, subscriptionReminderDays: { type: Number, default: 3 }
}, { _id: false });

const schema = new Schema({
  key: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  event: { type: String, enum: notificationEvents, required: true },
  channel: { type: String, enum: ["email", "whatsapp"], required: true },
  eventKey: String,
  deliveryKey: String,
  groupBookingVersion: Number,
  doctorRecipient: { type: Boolean, default: false },
  recipientAddress: String,
  subscriptionUserId: { type: Schema.Types.ObjectId, ref: "User" },
  subject: { type: String, required: true }, text: { type: String, required: true },
  status: { type: String, enum: ["pending", "sending", "sent", "skipped", "failed"], default: "pending" },
  attempts: { type: Number, default: 0 }, nextAttemptAt: { type: Date, default: Date.now },
  lockedUntil: Date, sentAt: Date, lastError: String,
  appointmentStart: Date, groupStart: Date, subscriptionExpiryAt: Date,
  appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
  groupSessionId: { type: Schema.Types.ObjectId, ref: "GroupSessionSlot" },
}, { timestamps: true });
schema.index({ status: 1, nextAttemptAt: 1 });
schema.index({ deliveryKey: 1 }, { unique: true, sparse: true });
export const Notification = mongoose.model("Notification", schema);
