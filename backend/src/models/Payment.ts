import mongoose, { Schema, Document } from "mongoose";

export type PaymentStatus = "created" | "paid" | "failed" | "refunded";

export interface PaymentDocument extends Document {
  appointmentId?: mongoose.Types.ObjectId;
  groupSessionSlotId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  provider: "razorpay";
  paymentType: "appointment" | "group_session";
  orderId: string;
  paymentId?: string;
  signature?: string;
  status: PaymentStatus;
  rawPayload?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    groupSessionSlotId: { type: Schema.Types.ObjectId, ref: "GroupSessionSlot" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    provider: { type: String, enum: ["razorpay"], default: "razorpay" },
    paymentType: { type: String, enum: ["appointment", "group_session"], default: "appointment" },
    orderId: { type: String, required: true },
    paymentId: { type: String },
    signature: { type: String },
    status: { type: String, enum: ["created", "paid", "failed", "refunded"], default: "created" },
    rawPayload: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1 }, { unique: true });
paymentSchema.index({ paymentId: 1 }, { unique: true, sparse: true });

export const Payment = mongoose.model<PaymentDocument>("Payment", paymentSchema);
