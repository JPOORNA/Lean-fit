import { Payment } from "../models/Payment";
import { User } from "../models/User";

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
  updateById: (id: string, data: Record<string, unknown>) => Payment.findByIdAndUpdate(id, data, { new: true }),

  findPaginated: async (filters: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    paymentType?: string;
  }) => {
    const { page, limit, search, status, paymentType } = filters;
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (paymentType) {
      query.paymentType = paymentType;
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

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("userId", "name email")
        .populate("appointmentId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query)
    ]);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const statsPipeline = await Payment.aggregate([
      {
        $facet: {
          todayGross: [
            { $match: { status: { $in: ["paid", "refunded"] }, createdAt: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ],
          weeklyGross: [
            { $match: { status: { $in: ["paid", "refunded"] }, createdAt: { $gte: startOfWeek } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ],
          monthlyGross: [
            { $match: { status: { $in: ["paid", "refunded"] }, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ],
          overallGross: [
            { $match: { status: { $in: ["paid", "refunded"] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ],
          totalOrders: [
            { $match: { status: { $in: ["paid", "refunded"] } } },
            { $count: "count" }
          ],
          totalRefunds: [
            { $match: { status: "refunded" } },
            { $count: "count" }
          ],
          totalRefundedAmount: [
            { $match: { status: "refunded" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ]
        }
      }
    ]);

    const resultStats = statsPipeline[0] || {};
    const todayGross = ((resultStats.todayGross && resultStats.todayGross[0]?.total) ?? 0) / 100;
    const weeklyGross = ((resultStats.weeklyGross && resultStats.weeklyGross[0]?.total) ?? 0) / 100;
    const monthlyGross = ((resultStats.monthlyGross && resultStats.monthlyGross[0]?.total) ?? 0) / 100;
    const overallGross = ((resultStats.overallGross && resultStats.overallGross[0]?.total) ?? 0) / 100;
    const totalOrders = (resultStats.totalOrders && resultStats.totalOrders[0]?.count) ?? 0;
    const totalRefunds = (resultStats.totalRefunds && resultStats.totalRefunds[0]?.count) ?? 0;
    const totalRefundedAmount = ((resultStats.totalRefundedAmount && resultStats.totalRefundedAmount[0]?.total) ?? 0) / 100;
    const netProfit = overallGross - totalRefundedAmount;

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        todayGross,
        weeklyGross,
        monthlyGross,
        overallGross,
        totalOrders,
        totalRefunds,
        totalRefundedAmount,
        netProfit
      }
    };
  }
};
