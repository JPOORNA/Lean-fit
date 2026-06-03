import { Request, Response } from "express";
import { MetricsService } from "../services/MetricsService";
import { startOfDayInTimezone } from "../utils/date";
import { AppError } from "../utils/errors";

export const MetricsController = {
  upsert: async (req: Request, res: Response) => {
    if (req.user?.role !== "client") {
      throw new AppError("Only clients can log metrics", 403, "FORBIDDEN");
    }
    const tz = req.user?.timezone ?? "UTC";
    const weekStartDate = startOfDayInTimezone(req.body.weekStartDate, tz);
    const metrics = await MetricsService.upsert(req.user!.id, {
      weekStartDate,
      weight: req.body.weight,
      height: req.body.height,
      bmi: req.body.bmi,
      extraFields: req.body.extraFields ?? {}
    });
    res.json({ metrics });
  },

  listMine: async (req: Request, res: Response) => {
    const metrics = await MetricsService.list(req.user!.id);
    res.json({ metrics });
  }
};
