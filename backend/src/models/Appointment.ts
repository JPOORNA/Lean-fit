import mongoose, { Schema, Document } from "mongoose";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type AppointmentType = "one_off" | "client_session";

export interface AppointmentDocument extends Document {
  doctorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  paymentStatus: PaymentStatus;
  sessionStatus: SessionStatus;
  type: AppointmentType;
  notes?: string;
  jitsiRoom?: string;
  jitsiUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<AppointmentDocument>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    sessionStatus: { type: String, enum: ["scheduled", "in_progress", "completed", "cancelled"], default: "scheduled" },
    type: { type: String, enum: ["one_off", "client_session"], default: "one_off" },
    notes: { type: String },
    jitsiRoom: { type: String },
    jitsiUrl: { type: String }
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, startTime: 1, endTime: 1 }, { unique: true });
appointmentSchema.index({ userId: 1, startTime: 1 });

export const Appointment = mongoose.model<AppointmentDocument>("Appointment", appointmentSchema);
