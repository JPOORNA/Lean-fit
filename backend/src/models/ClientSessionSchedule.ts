import mongoose, { Schema, Document } from "mongoose";

export interface ClientSessionScheduleDocument extends Document {
  userId: mongoose.Types.ObjectId;
  daysOfWeek: number[];
  timeSlots: { dayOfWeek: number; startTime: string; endTime: string }[];
  timezone: string;
  active: boolean;
  startDate: Date;
  endDate?: Date;
  generatedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const clientSessionScheduleSchema = new Schema<ClientSessionScheduleDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    daysOfWeek: { type: [Number], required: true },
    timeSlots: {
      type: [
        {
          dayOfWeek: { type: Number, min: 0, max: 6, required: true },
          startTime: { type: String, required: true },
          endTime: { type: String, required: true }
        }
      ],
      default: []
    },
    timezone: { type: String, default: "UTC" },
    active: { type: Boolean, default: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    generatedUntil: { type: Date }
  },
  { timestamps: true }
);

clientSessionScheduleSchema.index(
  { userId: 1, active: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);

export const ClientSessionSchedule = mongoose.model<ClientSessionScheduleDocument>(
  "ClientSessionSchedule",
  clientSessionScheduleSchema
);
