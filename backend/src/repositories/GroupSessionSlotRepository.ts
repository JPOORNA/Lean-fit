import mongoose from "mongoose";
import { GroupSessionSlot } from "../models/GroupSessionSlot";

export const GroupSessionSlotRepository = {
  create: (data: Record<string, unknown>, session?: mongoose.ClientSession) => {
    return GroupSessionSlot.create([data], session ? { session } : undefined).then((docs) => docs[0]);
  },
  findById: (id: string) => GroupSessionSlot.findById(id),
  listByDoctor: (doctorId: string) =>
    GroupSessionSlot.find({ doctorId }).sort({ startTime: 1 }),
  listByUser: (userId: string) =>
    GroupSessionSlot.find({ bookedUserIds: userId, status: "scheduled" }).sort({ startTime: 1 }),
  listOverlappingForDoctor: (doctorId: string, startTime: Date, endTime: Date) =>
    GroupSessionSlot.find(
      {
        doctorId,
        status: "scheduled",
        $or: [
          { startTime: { $lt: endTime, $gte: startTime } },
          { endTime: { $gt: startTime, $lte: endTime } },
          { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
        ]
      }
    ),
  findOverlappingForDoctor: (doctorId: string, startTime: Date, endTime: Date) =>
    GroupSessionSlot.findOne(
      {
        doctorId,
        status: "scheduled",
        $or: [
          { startTime: { $lt: endTime, $gte: startTime } },
          { endTime: { $gt: startTime, $lte: endTime } },
          { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
        ]
      }
    ),
  findOverlappingForUser: (userId: string, startTime: Date, endTime: Date) =>
    GroupSessionSlot.findOne(
      {
        bookedUserIds: userId,
        status: "scheduled",
        $or: [
          { startTime: { $lt: endTime, $gte: startTime } },
          { endTime: { $gt: startTime, $lte: endTime } },
          { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
        ]
      }
    ),
  listOverlappingForUser: (userId: string, startTime: Date, endTime: Date) =>
    GroupSessionSlot.find(
      {
        bookedUserIds: userId,
        status: "scheduled",
        $or: [
          { startTime: { $lt: endTime, $gte: startTime } },
          { endTime: { $gt: startTime, $lte: endTime } },
          { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
        ]
      }
    ),
  updateById: (id: string, data: Record<string, unknown>) =>
    GroupSessionSlot.findByIdAndUpdate(id, data, { new: true })
};
