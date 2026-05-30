import { Request, Response } from "express";
import { ClientSessionService } from "../services/ClientSessionService";

export const ClientSessionController = {
  create: async (req: Request, res: Response) => {
    const schedule = await ClientSessionService.createSchedule(req.user!.id, req.body.userId, {
      daysOfWeek: req.body.daysOfWeek,
      timeSlots: req.body.timeSlots,
      startDate: req.body.startDate,
      endDate: req.body.endDate
    });
    res.status(201).json({ schedule });
  },

  listMine: async (req: Request, res: Response) => {
    const schedules = await ClientSessionService.listSchedules(req.user!.id);
    res.json({ schedules });
  },

  update: async (req: Request, res: Response) => {
    const schedule = await ClientSessionService.updateSchedule(req.user!.id, req.params.id, {
      daysOfWeek: req.body.daysOfWeek,
      timeSlots: req.body.timeSlots,
      startDate: req.body.startDate,
      endDate: req.body.endDate
    });
    res.json({ schedule });
  },

  listByClient: async (req: Request, res: Response) => {
    const schedules = await ClientSessionService.listSchedules(req.params.userId);
    res.json({ schedules });
  },

  listAll: async (req: Request, res: Response) => {
    const schedules = await ClientSessionService.listAllActiveSchedules();
    res.json({ schedules });
  }
};
