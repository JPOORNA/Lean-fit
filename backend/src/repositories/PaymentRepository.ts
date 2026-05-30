import { Payment } from "../models/Payment";

export const PaymentRepository = {
  create: (data: Record<string, unknown>) => Payment.create(data),
  findByOrderId: (orderId: string) => Payment.findOne({ orderId }),
  findByAppointmentId: (appointmentId: string) => Payment.findOne({ appointmentId }).sort({ createdAt: -1 }),
  findByGroupSessionSlotId: (groupSessionSlotId: string) => Payment.findOne({ groupSessionSlotId }).sort({ createdAt: -1 }),
  findGroupSessionPaymentForUser: (groupSessionSlotId: string, userId: string) =>
    Payment.findOne({ groupSessionSlotId, userId, paymentType: "group_session" }).sort({ createdAt: -1 }),
  listByGroupSessionSlotId: (groupSessionSlotId: string) =>
    Payment.find({ groupSessionSlotId, paymentType: "group_session" })
      .populate("userId", "name email")
      .sort({ createdAt: -1 }),
  listGroupSessionPaymentsByUser: (userId: string) =>
    Payment.find({ userId, paymentType: "group_session" })
      .populate("groupSessionSlotId")
      .sort({ createdAt: -1 }),
  findById: (id: string) => Payment.findById(id),
  findAll: () => Payment.find().populate("userId", "name email").populate("appointmentId").sort({ createdAt: -1 }),
  updateById: (id: string, data: Record<string, unknown>) => Payment.findByIdAndUpdate(id, data, { new: true })
};
