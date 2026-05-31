import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";

export const PaymentController = {
  createOrder: async (req: Request, res: Response) => {
    const { appointmentId } = req.body;
    const result = await PaymentService.createOrder(req.user!.id, appointmentId);
    res.status(201).json(result);
  },

  createGroupOrder: async (req: Request, res: Response) => {
    const { groupSessionSlotId } = req.body;
    const result = await PaymentService.createGroupOrder(req.user!.id, groupSessionSlotId);
    res.status(201).json(result);
  },

  verify: async (req: Request, res: Response) => {
    const payment = await PaymentService.verifyPayment(req.user!.id, req.body);
    res.json({ payment });
  },

  verifyGroup: async (req: Request, res: Response) => {
    const payment = await PaymentService.verifyGroupPayment(req.user!.id, req.body);
    res.json({ payment });
  },

  refreshGroupPaymentStatus: async (req: Request, res: Response) => {
    const payment = await PaymentService.refreshGroupPaymentStatus(req.params.groupSessionSlotId, req.user!.id);
    res.json({ payment });
  },

  listAll: async (req: Request, res: Response) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const paymentType = req.query.paymentType as string;

    const result = await PaymentService.listPaymentsPaginated({
      page,
      limit,
      search,
      status,
      paymentType
    });
    res.json(result);
  },

  refund: async (req: Request, res: Response) => {
    const { id } = req.params;
    const payment = await PaymentService.initiateRefund(id);
    res.json({ payment });
  },

  updateGroupPaymentStatus: async (req: Request, res: Response) => {
    const payment = await PaymentService.manualUpdateGroupPaymentStatus(req.params.id, req.body.status);
    res.json({ payment });
  }
};
