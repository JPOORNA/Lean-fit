import { Request, Response } from "express";
import dayjs from "dayjs";
import { User } from "../models/User";
import { MealLog } from "../models/MealLog";
import { WorkoutLog } from "../models/WorkoutLog";
import { BodyMetrics } from "../models/BodyMetrics";
import { Appointment } from "../models/Appointment";

export const DashboardController = {
  getDoctorStats: async (req: Request, res: Response) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStartCalc = new Date(now);
    const day = weekStartCalc.getDay();
    const diff = weekStartCalc.getDate() - day + (day === 0 ? -6 : 1);
    const startOfThisWeek = new Date(weekStartCalc.setDate(diff));
    startOfThisWeek.setHours(0, 0, 0, 0);

    const clients = await User.find({ role: "client" }).select("_id");
    const clientIds = clients.map(c => c._id);

    const [
      totalClients,
      mealsToday,
      workoutsToday,
      weeklyMetrics,
      upcomingAppointments
    ] = await Promise.all([
      User.countDocuments({ role: "client" }),
      MealLog.countDocuments({ userId: { $in: clientIds }, takenAt: { $gte: startOfToday } }),
      WorkoutLog.countDocuments({ userId: { $in: clientIds }, date: { $gte: startOfToday }, attended: true }),
      BodyMetrics.countDocuments({ userId: { $in: clientIds }, weekStartDate: { $gte: startOfThisWeek } }),
      Appointment.countDocuments({ startTime: { $gte: now }, sessionStatus: "scheduled" })
    ]);

    res.json({
      totalClients,
      mealsToday,
      workoutsToday,
      weeklyMetrics,
      upcomingAppointments
    });
  },

  getRecentActivities: async (req: Request, res: Response) => {
    const limit = 5;
    const clients = await User.find({ role: "client" }).select("_id");
    const clientIds = clients.map(c => c._id);

    const [meals, workouts, metrics] = await Promise.all([
      MealLog.find({ userId: { $in: clientIds } }).sort({ createdAt: -1 }).limit(limit).populate("userId", "name"),
      WorkoutLog.find({ userId: { $in: clientIds } }).sort({ createdAt: -1 }).limit(limit).populate("userId", "name"),
      BodyMetrics.find({ userId: { $in: clientIds } }).sort({ createdAt: -1 }).limit(limit).populate("userId", "name")
    ]);

    const activities = [
      ...meals.map(m => ({ type: "meal", date: m.createdAt, user: m.userId, data: m })),
      ...workouts.map(w => ({ type: "workout", date: w.createdAt, user: w.userId, data: w })),
      ...metrics.map(me => ({ type: "metrics", date: me.createdAt, user: me.userId, data: me }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    res.json({ activities: activities.slice(0, 10) });
  },

  getClientsDailyStatus: async (req: Request, res: Response) => {
    const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
    
    const start = new Date(dateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const clients = await User.find({ role: "client" }).select("_id");
    const clientIds = clients.map(c => c._id);

    const weekStartCalc = dayjs(start).startOf("day");
    const day = weekStartCalc.day();
    const diff = day === 0 ? -6 : 1 - day;
    const startOfThisWeek = weekStartCalc.add(diff, "day").subtract(1, "day").toDate();
    const endOfThisWeek = dayjs(startOfThisWeek).add(8, "days").toDate();

    const [meals, workouts, metrics] = await Promise.all([
      MealLog.find({ userId: { $in: clientIds }, takenAt: { $gte: start, $lt: end } }),
      WorkoutLog.find({ userId: { $in: clientIds }, date: { $gte: start, $lt: end } }),
      BodyMetrics.find({ userId: { $in: clientIds }, weekStartDate: { $gte: startOfThisWeek, $lt: endOfThisWeek } })
    ]);

    const mealStatus: Record<string, boolean> = {};
    const workoutStatus: Record<string, boolean> = {};
    const metricsStatus: Record<string, boolean> = {};
    const lastMetricsDate: Record<string, string> = {};

    meals.forEach(m => mealStatus[m.userId.toString()] = true);
    workouts.forEach(w => workoutStatus[w.userId.toString()] = w.attended);
    
    metrics.forEach(m => {
      metricsStatus[m.userId.toString()] = true;
    });

    const allLastMetrics = await BodyMetrics.aggregate([
      { $match: { userId: { $in: clientIds } } },
      { $sort: { weekStartDate: -1 } },
      { $group: { _id: "$userId", lastDate: { $first: "$weekStartDate" } } }
    ]);

    allLastMetrics.forEach(m => {
      lastMetricsDate[m._id.toString()] = m.lastDate;
    });

    res.json({ mealStatus, workoutStatus, metricsStatus, lastMetricsDate });
  },

  getClientStats: async (req: Request, res: Response) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const weekStartCalc = new Date(now);
    const day = weekStartCalc.getDay();
    const diff = weekStartCalc.getDate() - day + (day === 0 ? -6 : 1);
    const startOfThisWeek = new Date(weekStartCalc.setDate(diff));
    startOfThisWeek.setHours(0, 0, 0, 0);

    const [mealsToday, bodyDataThisWeek, upcomingAppointments] = await Promise.all([
      MealLog.countDocuments({ userId: req.user!.id, takenAt: { $gte: startOfToday } }),
      BodyMetrics.findOne({ userId: req.user!.id, weekStartDate: { $gte: startOfThisWeek } }),
      Appointment.countDocuments({ userId: req.user!.id, startTime: { $gte: now }, sessionStatus: "scheduled" })
    ]);

    res.json({
      mealsToday,
      bodyDataThisWeek: !!bodyDataThisWeek,
      upcomingAppointments
    });
  }
};
