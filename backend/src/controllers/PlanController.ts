import { Request, Response } from "express";
import { PlanService } from "../services/PlanService";
import { uploadToR2, deleteFromR2 } from "../utils/r2Upload";
import { AppError } from "../utils/errors";
import { DietPlan } from "../models/DietPlan";
import { WorkoutPlan } from "../models/WorkoutPlan";

export const PlanController = {
  assignDietPlan: async (req: Request, res: Response) => {
    let fileUrl = req.body.fileUrl;

    if (req.file) {
      fileUrl = await uploadToR2(req.file, "diet-plans");
    }

    if (!fileUrl) {
      throw new AppError("Diet plan PDF is required", 400, "MISSING_PDF");
    }

    try {
      const plan = await PlanService.assignDietPlan(req.user!.id, req.params.userId, {
        fileUrl,
        name: req.body.name,
        description: req.body.description,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      });
      res.status(201).json({ plan });
    } catch (e: any) {
      throw new AppError(e.message, 400, "BAD_REQUEST");
    }
  },
  listMyDietPlans: async (req: Request, res: Response) => {
    const plans = await PlanService.listDietPlansForUser(req.user!.id);
    res.json({ plans });
  },
  updateDietPlan: async (req: Request, res: Response) => {
    const plan = await DietPlan.findById(req.params.id);
    if (!plan) throw new AppError("Plan not found", 404, "NOT_FOUND");

    let fileUrl = plan.fileUrl;
    if (req.file) {
      fileUrl = await uploadToR2(req.file, "diet-plans");
      // Optionally delete old file from R2
      if (plan.fileUrl) await deleteFromR2(plan.fileUrl);
    }

    const updated = await PlanService.updateDietPlan(req.params.id, {
      fileUrl,
      name: req.body.name,
      description: req.body.description,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
    });
    res.json({ plan: updated });
  },
  deleteDietPlan: async (req: Request, res: Response) => {
    const plan = await DietPlan.findById(req.params.id);
    if (!plan) throw new AppError("Plan not found", 404, "NOT_FOUND");
    if (plan.fileUrl) await deleteFromR2(plan.fileUrl);
    await PlanService.deleteDietPlan(req.params.id);
    res.json({ message: "Diet plan deleted" });
  },

  assignWorkoutPlan: async (req: Request, res: Response) => {
    let fileUrl = req.body.fileUrl;

    if (req.file) {
      fileUrl = await uploadToR2(req.file, "workout-plans");
    }

    if (!fileUrl) {
      throw new AppError("Workout plan PDF is required", 400, "MISSING_PDF");
    }

    try {
      const plan = await PlanService.assignWorkoutPlan(req.user!.id, req.params.userId, {
        fileUrl,
        name: req.body.name,
        description: req.body.description,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      });
      res.status(201).json({ plan });
    } catch (e: any) {
      throw new AppError(e.message, 400, "BAD_REQUEST");
    }
  },
  listMyWorkoutPlans: async (req: Request, res: Response) => {
    const plans = await PlanService.listWorkoutPlansForUser(req.user!.id);
    res.json({ plans });
  },
  updateWorkoutPlan: async (req: Request, res: Response) => {
    const plan = await WorkoutPlan.findById(req.params.id);
    if (!plan) throw new AppError("Plan not found", 404, "NOT_FOUND");

    let fileUrl = plan.fileUrl;
    if (req.file) {
      fileUrl = await uploadToR2(req.file, "workout-plans");
      if (plan.fileUrl) await deleteFromR2(plan.fileUrl);
    }

    const updated = await PlanService.updateWorkoutPlan(req.params.id, {
      fileUrl,
      name: req.body.name,
      description: req.body.description,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
    });
    res.json({ plan: updated });
  },
  deleteWorkoutPlan: async (req: Request, res: Response) => {
    const plan = await WorkoutPlan.findById(req.params.id);
    if (!plan) throw new AppError("Plan not found", 404, "NOT_FOUND");
    if (plan.fileUrl) await deleteFromR2(plan.fileUrl);
    await PlanService.deleteWorkoutPlan(req.params.id);
    res.json({ message: "Workout plan deleted" });
  }
};
