import { Appointment } from "../models/Appointment";
import { User } from "../models/User";
import { startOfDayInTimezone, endOfDayInTimezone } from "../utils/date";
import mongoose from "mongoose";

const activeOrNotExpiredPendingFilter = () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return {
    $or: [
      { paymentStatus: { $ne: "pending" } },
      { createdAt: { $gte: oneHourAgo } }
    ]
  };
};

export const AppointmentRepository = {
  create: (data: Record<string, unknown>, session?: mongoose.ClientSession) => {
    return Appointment.create([data], session ? { session } : undefined).then((docs) => docs[0]);
  },
  findOverlapping: (doctorId: string, userId: string, startTime: Date, endTime: Date, session?: mongoose.ClientSession) => {
    return Appointment.findOne(
      {
        $and: [
          { $or: [{ doctorId }, { userId }] },
          activeOrNotExpiredPendingFilter(),
          {
            $or: [
              { startTime: { $lt: endTime, $gte: startTime } },
              { endTime: { $gt: startTime, $lte: endTime } },
              { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
            ]
          }
        ],
        sessionStatus: { $in: ["scheduled", "in_progress"] }
      },
      null,
      session ? { session } : undefined
    );
  },
  findOverlappingForDoctor: (doctorId: string, startTime: Date, endTime: Date, session?: mongoose.ClientSession) => {
    return Appointment.findOne(
      {
        $and: [
          { doctorId },
          { sessionStatus: { $in: ["scheduled", "in_progress"] } },
          activeOrNotExpiredPendingFilter(),
          {
            $or: [
              { startTime: { $lt: endTime, $gte: startTime } },
              { endTime: { $gt: startTime, $lte: endTime } },
              { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
            ]
          }
        ]
      },
      null,
      session ? { session } : undefined
    );
  },
  findOverlappingForUser: (userId: string, startTime: Date, endTime: Date, session?: mongoose.ClientSession) => {
    return Appointment.findOne(
      {
        $and: [
          { userId },
          { sessionStatus: { $in: ["scheduled", "in_progress"] } },
          activeOrNotExpiredPendingFilter(),
          {
            $or: [
              { startTime: { $lt: endTime, $gte: startTime } },
              { endTime: { $gt: startTime, $lte: endTime } },
              { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
            ]
          }
        ]
      },
      null,
      session ? { session } : undefined
    );
  },
  listOverlappingForUserRange: (userId: string, startTime: Date, endTime: Date) => {
    return Appointment.find({
      $and: [
        { userId },
        { sessionStatus: { $in: ["scheduled", "in_progress"] } },
        activeOrNotExpiredPendingFilter(),
        {
          $or: [
            { startTime: { $lt: endTime, $gte: startTime } },
            { endTime: { $gt: startTime, $lte: endTime } },
            { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
          ]
        }
      ]
    });
  },
  listBlockingForDoctorRange: (doctorId: string, startTime: Date, endTime: Date) => {
    return Appointment.find({
      $and: [
        { doctorId },
        { sessionStatus: { $in: ["scheduled", "in_progress"] } },
        activeOrNotExpiredPendingFilter(),
        {
          $or: [
            { startTime: { $lt: endTime, $gte: startTime } },
            { endTime: { $gt: startTime, $lte: endTime } },
            { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
          ]
        }
      ]
    });
  },
  listByUser: (userId: string) => Appointment.find({ userId }).sort({ startTime: 1 }),
  listAll: (doctorId?: string) => {
    const query = doctorId ? { doctorId } : {};
    return Appointment.find(query).populate("userId", "name email timezone").populate("doctorId", "name email").sort({ startTime: 1 });
  },
  listAllPaginated: async (filters: {
    page: number;
    limit: number;
    type?: string;
    search?: string;
    date?: string;
    paymentStatus?: string;
    sessionStatus?: string;
    userTz?: string;
  }) => {
    const { page, limit, type, search, date, paymentStatus, sessionStatus, userTz } = filters;
    const tz = userTz || "UTC";
    const query: any = {};

    if (type) {
      query.type = type;
    }

    if (date) {
      const dayStart = startOfDayInTimezone(date, tz);
      const dayEnd = endOfDayInTimezone(date, tz);
      query.startTime = { $gte: dayStart, $lte: dayEnd };
    } else {
      const todayStart = startOfDayInTimezone(new Date(), tz);
      query.startTime = { $gte: todayStart };
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (sessionStatus) {
      query.sessionStatus = sessionStatus;
    }

    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id");
      query.userId = { $in: matchingUsers.map((u) => u._id) };
    }

    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate("userId", "name email timezone")
        .populate("doctorId", "name email")
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(query),
    ]);

    return {
      appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
  findById: (id: string) => Appointment.findById(id),
  updateById: (id: string, data: Record<string, unknown>) => Appointment.findByIdAndUpdate(id, data, { new: true })
};
