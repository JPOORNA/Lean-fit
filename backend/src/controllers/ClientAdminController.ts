import { Request, Response } from "express";
import { User } from "../models/User";
import { AppError } from "../utils/errors";
import { ClientSessionSchedule } from "../models/ClientSessionSchedule";
import { Appointment } from "../models/Appointment";
import { MealLog } from "../models/MealLog";
import { BodyMetrics } from "../models/BodyMetrics";
import { WorkoutLog } from "../models/WorkoutLog";
import { ClientSessionService } from "../services/ClientSessionService";
import { deleteMultipleFromR2 } from "../utils/r2Upload";
import { Payment } from "../models/Payment";
import { PaymentService } from "../services/PaymentService";
import { DietPlan } from "../models/DietPlan";
import { WorkoutPlan } from "../models/WorkoutPlan";
import { GroupSessionSlot } from "../models/GroupSessionSlot";

export const ClientAdminController = {
  listAll: async (req: Request, res: Response) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const role = req.query.role as string;
    const search = req.query.search as string;

    const filter: any = {};
    if (role && role !== "all") {
      filter.role = role;
    } else {
      filter.role = { $in: ["client", "user", "doctor"] };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (page !== undefined) {
      const skip = (page - 1) * limit;
      const [clients, total] = await Promise.all([
        User.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
        User.countDocuments(filter)
      ]);
      res.json({
        clients,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } else {
      const clients = await User.find(filter).sort({ name: 1 });
      res.json({ clients });
    }
  },

  updateSubscription: async (req: Request, res: Response) => {
    const user = await User.findById(req.params.userId);
    if (!user || user.role !== "client") {
      throw new AppError("Client not found", 404, "NOT_FOUND");
    }

    user.clientExpiresAt = new Date(req.body.clientExpiresAt);
    await user.save();

    await Appointment.deleteMany({
      userId: user._id,
      type: "client_session",
      startTime: { $gt: user.clientExpiresAt }
    });

    const schedules = await ClientSessionSchedule.find({ userId: user._id, active: true });
    for (const schedule of schedules) {
      await ClientSessionService.generateAppointmentsForSchedule(schedule.id, 4);
    }

    res.json({ user });
  },

  updateRole: async (req: Request, res: Response) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    const nextRole = req.body.role;
    user.role = nextRole;

    if (nextRole === "client") {
      if (!req.body.clientExpiresAt) {
        throw new AppError("clientExpiresAt is required for clients", 400, "MISSING_EXPIRY");
      }
      user.clientExpiresAt = new Date(req.body.clientExpiresAt);
    } else {
      user.clientExpiresAt = undefined;
      
      await ClientSessionSchedule.updateMany({ userId: user._id }, { active: false });
      await Appointment.deleteMany({
        userId: user._id,
        type: "client_session",
        startTime: { $gte: new Date() }
      });

      if (req.body.purgeData) {
        const meals = await MealLog.find({ userId: user._id }, { imageUrl: 1 });
        const imageUrls = meals.map(m => m.imageUrl).filter(Boolean);

        await Promise.all([
          MealLog.deleteMany({ userId: user._id }),
          BodyMetrics.deleteMany({ userId: user._id }),
          WorkoutLog.deleteMany({ userId: user._id })
        ]);

        if (imageUrls.length > 0) {
          await deleteMultipleFromR2(imageUrls);
        }
      }
    }

    await user.save();
    res.json({ user });
  },

  deleteUser: async (req: Request, res: Response) => {
    const { userId } = req.params;
    const refundAll = req.query.refundAll === "true";

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    if (refundAll) {
      const paidPayments = await Payment.find({ userId: user._id, status: "paid" });
      for (const payment of paidPayments) {
        try {
          await PaymentService.initiateRefund(payment._id.toString());
        } catch (err) {
          console.error(`Failed to refund payment ${payment._id} for user ${userId}:`, err);
        }
      }
    }

    const meals = await MealLog.find({ userId: user._id }, { imageUrl: 1 });
    const imageUrls = meals.map(m => m.imageUrl).filter(Boolean);

    await Promise.all([
      MealLog.deleteMany({ userId: user._id }),
      BodyMetrics.deleteMany({ userId: user._id }),
      WorkoutLog.deleteMany({ userId: user._id }),
      ClientSessionSchedule.deleteMany({ userId: user._id }),
      Appointment.deleteMany({ userId: user._id }),
      DietPlan.deleteMany({ assignedTo: user._id }),
      WorkoutPlan.deleteMany({ assignedTo: user._id }),
      GroupSessionSlot.updateMany({ bookedUserIds: user._id }, { $pull: { bookedUserIds: user._id } })
    ]);

    if (imageUrls.length > 0) {
      try {
        await deleteMultipleFromR2(imageUrls);
      } catch (err) {
        console.error("Failed to delete meals images from R2:", err);
      }
    }

    await User.findByIdAndDelete(user._id);

    res.json({ success: true, message: "User deleted successfully" });
  }
};
