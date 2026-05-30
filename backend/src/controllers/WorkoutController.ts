import { Request, Response } from "express";
import { WorkoutService } from "../services/WorkoutService";
import { startOfDayInTimezone } from "../utils/date";
import { AppError } from "../utils/errors";

export const WorkoutController = {
  upsert: async (req: Request, res: Response) => {
    if (req.user?.role !== "client") {
      throw new AppError("Only clients can log workouts", 403, "FORBIDDEN");
    }
    const tz = req.user?.timezone ?? "UTC";
    const dateValue = startOfDayInTimezone(req.body.date, tz);
    const log = await WorkoutService.upsert(req.user!.id, {
      date: dateValue,
      attended: req.body.attended,
      notes: req.body.notes
    });
    res.json({ log });
  },

  listMine: async (req: Request, res: Response) => {
    const logs = await WorkoutService.list(req.user!.id);
    res.json({ logs });
  }
};
