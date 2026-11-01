import crypto from "crypto";
import { shouldRunNotificationWorker } from "./NotificationWorkerPolicy";
import { DoctorNotificationService } from "./DoctorNotificationService";
import { appointmentMeetingLink, groupMeetingLink, includeMeetingLink, siteLink } from "../utils/notificationLinks";
import { Notification, NotificationEvent, notificationDefaults } from "../models/Notification";
import { User, UserDocument } from "../models/User";
import { Appointment } from "../models/Appointment";
import { GroupSessionSlot } from "../models/GroupSessionSlot";
import { DeliveryService } from "./DeliveryService";
import { env } from "../config/env";

export const preferencesFor = (user: UserDocument) => ({ ...notificationDefaults, ...((user.toObject() as any).notificationPreferences ?? {}) });
export const NotificationService = {
  async enqueue(user: UserDocument, event: NotificationEvent, key: string, subject: string, text: string, related: { appointmentId?: unknown; groupSessionId?: unknown; appointmentStart?: Date; groupStart?: Date; subscriptionExpiryAt?: Date; subscriptionUserId?: unknown; groupBookingVersion?: number } = {}) {
    if (user.role === "doctor") {
      if (!user.isActive) return;
      const routing = await DoctorNotificationService.getRouting();
      const rule = routing.events[event];
      if (!rule.enabled) return;
      for (const channel of ["email", "whatsapp"] as const) {
        const recipients = channel === "email" ? rule.emails : rule.whatsappNumbers;
        for (const address of new Set(recipients)) {
          const recipientKey = crypto.createHash("sha256").update(address).digest("hex");
          const sharedAlert = event === "mealUpload" || Boolean(related.subscriptionUserId);
          const ownerScope = sharedAlert ? "doctor-recipients" : user.id;
          await Notification.updateOne({ key: `${key}:${ownerScope}:${channel}:${recipientKey}` }, { $setOnInsert: {
            eventKey: key, userId: user.id, doctorRecipient: true, recipientAddress: address, event, channel, subject, text, ...related
          } }, { upsert: true });
        }
      }
      return;
    }
    const preferences = preferencesFor(user);
    if (!user.isActive || !preferences[event]) return;
    for (const channel of ["email", "whatsapp"] as const) {
      if (!preferences[channel]) continue;
      await Notification.updateOne({ key: `${key}:${user.id}:${channel}` }, { $setOnInsert: {
        eventKey: key, userId: user.id, event, channel, subject, text, ...related
      } }, { upsert: true });
    }
  },
  async mealUploaded(userId: string, mealId: string) {
    const user = await User.findById(userId);
    if (!user) return;
    for (const doctor of await User.find({ role: "doctor", isActive: true })) {
      await this.enqueue(doctor, "mealUpload", `meal:${mealId}`, "New meal photo", `${user.name} uploaded a meal photo. Review meal photos: ${siteLink(`/doctor/clients/${user.id}`)}`);
    }
  },
  async schedule(now = new Date()) {
    const doctorRouting = await DoctorNotificationService.getRouting();
    const doctors = await User.find({ role: "doctor", isActive: true });
    const reminderMinutes = (person: UserDocument) => person.role === "doctor" ? doctorRouting.bookingReminderMinutes : preferencesFor(person).bookingReminderMinutes;
    // Existing roles may change on expiry; a subscription date, not a role, determines reminders.
    for await (const user of User.find({ isActive: true, clientExpiresAt: { $gte: new Date(now.getTime() - 86400000), $lte: new Date(now.getTime() + 30 * 86400000) } }).cursor()) {
      const p = preferencesFor(user), expiry = user.clientExpiresAt!;
      if (expiry.getTime() - now.getTime() <= p.subscriptionReminderDays * 86400000) {
        const date = expiry.toLocaleString("en-IN", { timeZone: user.timezone || "UTC" });
        await this.enqueue(user, "subscriptionExpiry", `expiry:${expiry.toISOString()}:${p.subscriptionReminderDays}`, "Subscription expiry reminder", `Your Leanfit subscription ${expiry <= now ? "expired" : "expires"} on ${date}. Contact your doctor to renew. Contact Leanfit: ${siteLink("/contact")}`, { subscriptionExpiryAt: expiry });
      }
      if (user.role !== "doctor" && expiry.getTime() - now.getTime() <= doctorRouting.subscriptionReminderDays * 86400000) {
        for (const doctor of doctors) {
          await this.enqueue(doctor, "subscriptionExpiry", `client-expiry:${user.id}:${expiry.toISOString()}:${doctorRouting.subscriptionReminderDays}`, "Client subscription expiry", `${user.name}’s subscription ${expiry <= now ? "expired" : "expires"} on ${expiry.toLocaleString("en-IN", { timeZone: doctor.timezone || "UTC" })}. View client: ${siteLink(`/doctor/clients/${user.id}`)}`, { subscriptionExpiryAt: expiry, subscriptionUserId: user._id });
        }
      }
    }
    for await (const appointment of Appointment.find({ paymentStatus: "paid", sessionStatus: "scheduled", startTime: { $gt: now } }).cursor()) {
      const participants = await User.find({ _id: { $in: [appointment.userId, appointment.doctorId] }, isActive: true });
      for (const person of participants) {
        const date = appointment.startTime.toLocaleString("en-IN", { timeZone: person.timezone || "UTC" });
        const attendee = participants.find(p => p.id === appointment.userId.toString());
        const text = `${person.id === appointment.doctorId.toString() ? `Consultation with ${attendee?.name || "your client"}. ` : ""}Leanfit consultation on ${date} (${person.timezone || "UTC"}). ${appointmentMeetingLink(appointment) ? `Join meeting: ${appointmentMeetingLink(appointment)}` : `View booking: ${siteLink(`/${person.role}/appointments`)}`}`;
        const key = `appointment:${appointment.id}:${appointment.startTime.toISOString()}`;
        await this.enqueue(person, "bookingConfirmation", `${key}:confirmed`, "Booking confirmed", text, { appointmentId: appointment._id, appointmentStart: appointment.startTime });
        if (appointment.startTime.getTime() - now.getTime() <= reminderMinutes(person) * 60000)
          await this.enqueue(person, "bookingReminder", `${key}:reminder`, "Upcoming consultation", text, { appointmentId: appointment._id, appointmentStart: appointment.startTime });
      }
    }
    for await (const slot of GroupSessionSlot.find({ status: "scheduled", startTime: { $gt: now } }).cursor()) {
      if (!slot.bookedUserIds.length) continue;
      const users = await User.find({ _id: { $in: [...slot.bookedUserIds, slot.doctorId] }, isActive: true });
      for (const person of users) {
        const text = `Leanfit group session on ${slot.startTime.toLocaleString("en-IN", { timeZone: person.timezone || "UTC" })}. Join meeting: ${groupMeetingLink(slot.id)}`;
        const key = `group:${slot.id}:${slot.startTime.toISOString()}:${slot.bookedUserIds.length}`;
        // A doctor's confirmation reflects the current participant count; client confirmations stay stable.
        const confirmationKey = person.role === "doctor" ? key : `group:${slot.id}:${slot.startTime.toISOString()}`;
        await this.enqueue(person, "bookingConfirmation", `${confirmationKey}:confirmed`, "Group booking confirmed", text, { groupSessionId: slot._id, groupStart: slot.startTime, groupBookingVersion: slot.bookedUserIds.length });
        if (slot.startTime.getTime() - now.getTime() <= reminderMinutes(person) * 60000)
          await this.enqueue(person, "bookingReminder", `group:${slot.id}:${slot.startTime.toISOString()}:reminder`, "Upcoming group session", text, { groupSessionId: slot._id, groupStart: slot.startTime, groupBookingVersion: slot.bookedUserIds.length });
      }
    }
  },
  async deliver() {
    for (let i = 0; i < 50; i++) {
      const now = new Date();
      const job = await Notification.findOneAndUpdate({ attempts: { $lt: 5 }, nextAttemptAt: { $lte: now }, $or: [{ status: "pending" }, { status: "sending", lockedUntil: { $lte: now } }] }, {
        $set: { status: "sending", lockedUntil: new Date(now.getTime() + 120000) }, $inc: { attempts: 1 }
      }, { new: true });
      if (!job) break;
      try {
        const user = await User.findById(job.userId);
        const p = user && preferencesFor(user);
        const channel = job.channel as "email" | "whatsapp";
        const routed = job.doctorRecipient || user?.role === "doctor";
        let valid = Boolean(user?.isActive);
        if (routed) {
          const rule = (await DoctorNotificationService.getRouting()).events[job.event as NotificationEvent];
          const recipients = channel === "email" ? rule.emails : rule.whatsappNumbers;
          valid = valid && user?.role === "doctor" && rule.enabled && !!job.recipientAddress && recipients.includes(job.recipientAddress);
        } else {
          valid = valid && !!p?.[job.event as NotificationEvent] && !!p?.[channel];
        }
        if (job.subscriptionExpiryAt) {
          const subscriber = job.subscriptionUserId ? await User.findById(job.subscriptionUserId) : user;
          valid = valid && !!subscriber?.isActive && subscriber.clientExpiresAt?.getTime() === job.subscriptionExpiryAt.getTime();
        }
        if (job.appointmentId) {
          const appointment = await Appointment.findOne({ _id: job.appointmentId, $or: [{ doctorId: user?._id }, { userId: user?._id }], paymentStatus: "paid", sessionStatus: "scheduled", startTime: { $gt: now, $eq: job.appointmentStart } });
          valid = valid && Boolean(appointment);
          const url = appointment && appointmentMeetingLink(appointment);
          if (url) job.text = includeMeetingLink(job.text, url);
        }
        if (job.groupSessionId) {
          valid = valid && Boolean(await GroupSessionSlot.exists({ _id: job.groupSessionId, status: "scheduled", startTime: { $gt: now, $eq: job.groupStart }, $or: [{ doctorId: user?._id }, { bookedUserIds: user?._id }] }));
          job.text = includeMeetingLink(job.text, groupMeetingLink(job.groupSessionId.toString()));
        }
        if (!valid) { job.status = "skipped"; job.deliveryKey = undefined; await job.save(); continue; }
        // Shared doctor lists receive one copy per event, including legacy per-doctor jobs.
        if (routed && (job.event === "mealUpload" || job.subscriptionUserId)) {
          const eventKey = job.eventKey || job.key.split(":").slice(0, -3).join(":");
          if (eventKey) {
            const prefix = eventKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const duplicate = await Notification.exists({
              _id: { $ne: job._id }, doctorRecipient: true, event: job.event,
              channel, recipientAddress: job.recipientAddress,
              key: new RegExp(`^${prefix}:`),
              $or: [
                { status: "sent" },
                { _id: { $lt: job._id }, status: { $in: ["pending", "sending", "failed"] } }
              ]
            });
            if (duplicate) { job.status = "skipped"; job.lastError = undefined; await job.save(); continue; }
          }
        }
        const recipient = routed ? job.recipientAddress! : channel === "email" ? user!.email : user!.whatsappNumber ?? "";
        const sourceKey = job.eventKey || job.key.split(":").slice(0, routed ? -3 : -2).join(":");
        const occurrence = job.appointmentId
          ? `appointment:${job.appointmentId}:${job.appointmentStart?.toISOString()}`
          : job.groupSessionId
            ? `group:${job.groupSessionId}:${job.groupStart?.toISOString()}:${job.event === "bookingConfirmation" ? job.groupBookingVersion ?? 1 : "reminder"}`
            : job.subscriptionExpiryAt
              ? `expiry:${job.subscriptionUserId || job.userId}:${job.subscriptionExpiryAt.toISOString()}`
              : sourceKey || job.key;
        const address = channel === "email" ? recipient.trim().toLowerCase() : recipient.replace(/[\s()-]/g, "");
        const deliveryKey = crypto.createHash("sha256").update(`${job.event}:${occurrence}:${channel}:${address}`).digest("hex");
        try {
          // The unique index makes this claim atomic across doctor/client copies and workers.
          await Notification.updateOne({ _id: job._id }, { $set: { deliveryKey } });
        } catch (error) {
          if (error && typeof error === "object" && "code" in error && error.code === 11000) {
            job.status = "skipped"; job.lastError = undefined; await job.save(); continue;
          }
          throw error;
        }
        await DeliveryService.send(channel, recipient, job.subject, job.text, job.key, undefined, job.event);
        job.status = "sent"; job.sentAt = new Date(); job.lastError = undefined;
      } catch (error) {
        job.status = job.attempts >= 5 ? "failed" : "pending";
        job.nextAttemptAt = new Date(Date.now() + Math.pow(2, job.attempts) * 60000);
        job.lastError = error instanceof Error ? error.message.slice(0, 200) : "Delivery failed";
      }
      await job.save();
    }
  }
};
let running: Promise<void> | undefined;
let timer: NodeJS.Timeout | undefined;
export const startNotificationWorker = () => {
  if (!env.notificationsEnabled || !shouldRunNotificationWorker() || timer) return;
  const tick = () => {
    if (running) return;
    running = NotificationService.schedule().then(() => NotificationService.deliver()).catch(() => console.error("Notification worker failed; will retry next minute")).finally(() => { running = undefined; });
  };
  tick(); timer = setInterval(tick, 60000); timer.unref();
};
export const stopNotificationWorker = async () => { if (timer) clearInterval(timer); timer = undefined; await running; };
