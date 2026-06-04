import { Request, Response } from "express";
import { MealLog } from "../models/MealLog";
import { BodyMetrics } from "../models/BodyMetrics";
import { WorkoutLog } from "../models/WorkoutLog";
import { Appointment } from "../models/Appointment";
import { Payment } from "../models/Payment";
import { DietPlan } from "../models/DietPlan";
import { WorkoutPlan } from "../models/WorkoutPlan";
import { MealService } from "../services/MealService";
import { User } from "../models/User";

export const ClientHistoryController = {
  getHistory: async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const [meals, metrics, workouts, appointments, payments, dietPlans, workoutPlans] = await Promise.all([
      MealLog.find({ userId }).sort({ takenAt: -1 }),
      BodyMetrics.find({ userId }).sort({ weekStartDate: -1 }),
      WorkoutLog.find({ userId }).sort({ date: -1 }),
      Appointment.find({ userId }).sort({ startTime: -1 }),
      Payment.find({ userId }).sort({ createdAt: -1 }),
      DietPlan.find({ assignedTo: userId, isActive: true }).sort({ createdAt: -1 }),
      WorkoutPlan.find({ assignedTo: userId, isActive: true }).sort({ createdAt: -1 })
    ]);

    res.json({
      meals,
      metrics,
      workouts,
      appointments,
      payments,
      dietPlans,
      workoutPlans
    });
  },

  getMealDailyStatus: async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    const user = await User.findById(userId);
    const tz = user?.timezone ?? "UTC";
    const days = await MealService.listDailyStatus(userId, startDate, endDate, tz);
    res.json({ days });
  }
};
