import { notificationEvents, NotificationEvent } from "./Notification";
import mongoose, { Schema, Document } from "mongoose";

export const whatsappTemplateKeys = ["otp", "bookingConfirmation", "bookingReminder", "subscriptionExpiry", "mealUpload"] as const;
export type WhatsAppTemplateNames = Record<typeof whatsappTemplateKeys[number], string>;

export type DoctorNotificationRouting = {
  events: Record<NotificationEvent, { enabled: boolean; emails: string[]; whatsappNumbers: string[] }>;
  bookingReminderMinutes: number;
  subscriptionReminderDays: number;
};
const emptyRecipientRule = () => ({ enabled: false, emails: [] as string[], whatsappNumbers: [] as string[] });
export const doctorNotificationDefaults = (): DoctorNotificationRouting => ({
  events: {
    bookingConfirmation: emptyRecipientRule(), bookingReminder: emptyRecipientRule(),
    subscriptionExpiry: emptyRecipientRule(), mealUpload: emptyRecipientRule()
  },
  bookingReminderMinutes: 60,
  subscriptionReminderDays: 3
});
const recipientRuleSchema = new Schema({
  enabled: { type: Boolean, default: false },
  emails: { type: [String], default: [] },
  whatsappNumbers: { type: [String], default: [] }
}, { _id: false });
const routingSchema = new Schema({
  events: {
    type: new Schema(Object.fromEntries(notificationEvents.map(event => [event, { type: recipientRuleSchema, default: () => ({}) }])), { _id: false }),
    default: () => ({})
  },
  bookingReminderMinutes: { type: Number, default: 60 },
  subscriptionReminderDays: { type: Number, default: 3 }
}, { _id: false });

export interface DoctorSettingsDocument extends Document {
  notificationRouting?: DoctorNotificationRouting;
  whatsappTemplates?: WhatsAppTemplateNames;
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
    notificationRouting: { type: routingSchema, default: doctorNotificationDefaults },
    whatsappTemplates: {
      type: new Schema({
        otp: { type: String, default: "" },
        bookingConfirmation: { type: String, default: "" },
        bookingReminder: { type: String, default: "" },
        subscriptionExpiry: { type: String, default: "" },
        mealUpload: { type: String, default: "" }
      }, { _id: false }),
      default: () => ({})
    },
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
