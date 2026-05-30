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
    const payments = await PaymentService.listAllPayments();
    res.json({ payments });
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
