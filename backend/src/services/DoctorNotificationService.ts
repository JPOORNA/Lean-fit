import { Notification } from "../models/Notification";
import { DoctorSettings, DoctorNotificationRouting, doctorNotificationDefaults } from "../models/DoctorSettings";

export const DoctorNotificationService = {
  async getDeliveryStatus() {
    return Notification.aggregate([
      { $match: { doctorRecipient: true } },
      { $sort: { updatedAt: -1, _id: -1 } },
      { $group: { _id: { event: "$event", channel: "$channel" }, status: { $first: "$status" }, attempts: { $first: "$attempts" }, lastError: { $first: "$lastError" }, updatedAt: { $first: "$updatedAt" } } },
      { $project: { _id: 0, event: "$_id.event", channel: "$_id.channel", status: 1, attempts: 1, lastError: 1, updatedAt: 1 } }
    ]);
  },
  async getRouting(): Promise<DoctorNotificationRouting> {
    const settings = await DoctorSettings.findOne().select("notificationRouting").lean();
    const stored = settings?.notificationRouting;
    return {
      ...doctorNotificationDefaults(),
      ...stored,
      events: { ...doctorNotificationDefaults().events, ...stored?.events }
    };
  }
};
