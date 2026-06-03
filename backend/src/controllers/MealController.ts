import { Request, Response } from "express";
import { MealService } from "../services/MealService";
import { uploadToR2 } from "../utils/r2Upload";
import { AppError } from "../utils/errors";

export const MealController = {
  create: async (req: Request, res: Response) => {
    let imageUrl = req.body.imageUrl;

    if (req.file) {
      imageUrl = await uploadToR2(req.file, "meals");
    }

    if (!imageUrl) {
      throw new AppError("Meal image is required", 400, "MISSING_MEAL_IMAGE");
    }

    if (req.user?.role !== "client") {
      throw new AppError("Only clients can log meals", 403, "FORBIDDEN");
    }

    const meal = await MealService.create(req.user!.id, {
      imageUrl,
      notes: req.body.notes,
      takenAt: new Date(req.body.takenAt)
    });
    res.status(201).json({ meal });
  },

  listMine: async (req: Request, res: Response) => {
    const meals = await MealService.list(req.user!.id);
    res.json({ meals });
  },

  listDailyStatus: async (req: Request, res: Response) => {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    const tz = req.user?.timezone ?? "UTC";
    const days = await MealService.listDailyStatus(req.user!.id, startDate, endDate, tz);
    res.json({ days });
  }
};
