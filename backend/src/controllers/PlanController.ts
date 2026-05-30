import { Request, Response } from "express";
import { PlanService } from "../services/PlanService";
import { uploadToR2 } from "../utils/r2Upload";
import { AppError } from "../utils/errors";

export const PlanController = {
  assignDietPlan: async (req: Request, res: Response) => {
    let fileUrl = req.body.fileUrl;

    if (req.file) {
      fileUrl = await uploadToR2(req.file, "diet-plans");
    }

    if (!fileUrl) {
      throw new AppError("Diet plan PDF is required", 400, "MISSING_PDF");
    }

    const plan = await PlanService.assignDietPlan(req.user!.id, req.params.userId, {
      fileUrl,
      name: req.body.name,
      description: req.body.description,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
    });
    res.status(201).json({ plan });
  },
  listMyDietPlans: async (req: Request, res: Response) => {
    const plans = await PlanService.listDietPlansForUser(req.user!.id);
    res.json({ plans });
  },

  assignWorkoutPlan: async (req: Request, res: Response) => {
    let fileUrl = req.body.fileUrl;

    if (req.file) {
      fileUrl = await uploadToR2(req.file, "workout-plans");
    }

    if (!fileUrl) {
      throw new AppError("Workout plan PDF is required", 400, "MISSING_PDF");
    }

    const plan = await PlanService.assignWorkoutPlan(req.user!.id, req.params.userId, {
      fileUrl,
      name: req.body.name,
      description: req.body.description,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
    });
    res.status(201).json({ plan });
  },
  listMyWorkoutPlans: async (req: Request, res: Response) => {
    const plans = await PlanService.listWorkoutPlansForUser(req.user!.id);
    res.json({ plans });
  }
};
