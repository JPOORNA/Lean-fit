import mongoose, { Schema, Document } from "mongoose";

export interface DoctorSettingsDocument extends Document {
  timezone: string;
  weeklyAvailability: {
    dayOfWeek: number;
    workingHours: { start: string; end: string }[];
  }[];
  breaks: { dayOfWeek: number; start: string; end: string }[];
  holidays: { date: string; isFullDay: boolean; start?: string; end?: string; note?: string }[];
  blockedSlots: { start: Date; end: Date; reason?: string }[];
  defaultSlotDurationMinutes: number;
  appointmentFeePaise?: number;
  dynamicMetricFields: { key: string; label: string; type: "number" | "text" }[];
}

const timeRangeSchema = new Schema({
  start: { type: String, required: true },
  end: { type: String, required: true }
}, { _id: false });

const doctorSettingsSchema = new Schema<DoctorSettingsDocument>(
  {
    timezone: { type: String, default: "UTC" },
    weeklyAvailability: {
      type: [
        {
          dayOfWeek: { type: Number, min: 0, max: 6, required: true },
          workingHours: { type: [timeRangeSchema], default: [] }
        }
      ],
      default: []
    },
    breaks: {
      type: [
        {
          dayOfWeek: { type: Number, min: 0, max: 6, required: true },
          start: { type: String, required: true },
          end: { type: String, required: true }
        }
      ],
      default: []
    },
    holidays: {
      type: [
        {
          date: { type: String, required: true },
          isFullDay: { type: Boolean, default: true },
          start: { type: String },
          end: { type: String },
          note: { type: String }
        }
      ],
      default: []
    },
    blockedSlots: {
      type: [
        {
          start: { type: Date, required: true },
          end: { type: Date, required: true },
          reason: { type: String }
        }
      ],
      default: []
    },
    defaultSlotDurationMinutes: { type: Number, default: 30 },
    appointmentFeePaise: { type: Number },
    dynamicMetricFields: {
      type: [
        {
          key: { type: String, required: true },
          label: { type: String, required: true },
          type: { type: String, enum: ["number", "text"], required: true }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

export const DoctorSettings = mongoose.model<DoctorSettingsDocument>("DoctorSettings", doctorSettingsSchema);
