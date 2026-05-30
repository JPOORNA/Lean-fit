import { Request, Response } from "express";
import { DoctorSettings } from "../models/DoctorSettings";
import { AppError } from "../utils/errors";
import { parseDateTimeInTimezone } from "../utils/date";

export const DoctorSettingsController = {
  getSettings: async (req: Request, res: Response) => {
    const settings = await DoctorSettings.findOne({ doctorId: req.user?.id });
    res.json({ settings });
  },

  getPublicSettings: async (req: Request, res: Response) => {
    const settings = await DoctorSettings.findOne();
    res.json({ 
      settings: {
        dynamicMetricFields: settings?.dynamicMetricFields ?? [],
        timezone: settings?.timezone ?? "UTC"
      }
    });
  },

  upsertSettings: async (req: Request, res: Response) => {
    const existing = await DoctorSettings.findOne({ doctorId: req.user?.id });
    const tz = req.body.timezone || existing?.timezone || req.user?.timezone || "UTC";
    const updatePayload: Record<string, unknown> = { ...req.body, doctorId: req.user?.id };
    if (Array.isArray(req.body.blockedSlots)) {
      updatePayload.blockedSlots = req.body.blockedSlots.map((slot: { start: string; end: string; reason?: string }) => ({
        ...slot,
        start: parseDateTimeInTimezone(slot.start, tz),
        end: parseDateTimeInTimezone(slot.end, tz)
      }));
    }

    const settings = await DoctorSettings.findOneAndUpdate(
      { doctorId: req.user?.id },
      { $set: updatePayload },
      { upsert: true, new: true }
    );

    if (req.body.timezone) {
      const { User } = require("../models/User");
      await User.findByIdAndUpdate(req.user?.id, { timezone: req.body.timezone });
    }

    res.json({ settings });
  },

  addHoliday: async (req: Request, res: Response) => {
    const settings = await DoctorSettings.findOne({ doctorId: req.user?.id });
    if (!settings) throw new AppError("Settings not found", 404, "NOT_FOUND");
    settings.holidays.push(req.body);
    await settings.save();
    res.json({ settings });
  },

  addBreak: async (req: Request, res: Response) => {
    const settings = await DoctorSettings.findOne({ doctorId: req.user?.id });
    if (!settings) throw new AppError("Settings not found", 404, "NOT_FOUND");
    settings.breaks.push(req.body);
    await settings.save();
    res.json({ settings });
  },

  blockSlot: async (req: Request, res: Response) => {
    const settings = await DoctorSettings.findOne({ doctorId: req.user?.id });
    if (!settings) throw new AppError("Settings not found", 404, "NOT_FOUND");
    const tz = settings.timezone || req.user?.timezone || "UTC";
    settings.blockedSlots.push({
      ...req.body,
      start: parseDateTimeInTimezone(req.body.start, tz),
      end: parseDateTimeInTimezone(req.body.end, tz)
    });
    await settings.save();
    res.json({ settings });
  }
};
