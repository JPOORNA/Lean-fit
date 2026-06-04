import { Request, Response } from "express";
import { AppointmentService } from "../services/AppointmentService";
import { PaymentService } from "../services/PaymentService";
import { AppointmentRepository } from "../repositories/AppointmentRepository";
import { AppError } from "../utils/errors";
import { DoctorSettings } from "../models/DoctorSettings";
import { User } from "../models/User";
import { UserRepository } from "../repositories/UserRepository";
import { ScheduleService } from "../services/ScheduleService";
import { dateKeyInTimezone, endOfDayInTimezone, parseDateTimeInTimezone, startOfDayInTimezone } from "../utils/date";
import { GroupSessionSlotRepository } from "../repositories/GroupSessionSlotRepository";

export const AppointmentController = {
  listAvailableSlots: async (req: Request, res: Response) => {
    const { date } = req.query;
    if (!date) throw new AppError("Date is required", 400, "BAD_REQUEST");

    const doctor = await User.findOne({ role: "doctor" });
    if (!doctor) throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND");

    const settings = await DoctorSettings.findOne();
    if (!settings) throw new AppError("Settings not found", 404, "SETTINGS_NOT_FOUND");

    const appointments = await AppointmentRepository.listAll(doctor.id);
    const doctorTz = settings.timezone || "UTC";
    const clientTz = req.user?.timezone || doctorTz;
    const clientDayStart = startOfDayInTimezone(date as string, clientTz);
    const clientDayEnd = endOfDayInTimezone(date as string, clientTz);

    const doctorDateStart = dateKeyInTimezone(clientDayStart, doctorTz);
    const doctorDateEnd = dateKeyInTimezone(clientDayEnd, doctorTz);
    const doctorDates = doctorDateStart === doctorDateEnd ? [doctorDateStart] : [doctorDateStart, doctorDateEnd];

    const doctorDayStarts = doctorDates.map((doctorDate) => startOfDayInTimezone(doctorDate, doctorTz));
    const doctorDayEnds = doctorDates.map((doctorDate) => endOfDayInTimezone(doctorDate, doctorTz));
    const rangeStart = new Date(Math.min(...doctorDayStarts.map((d) => d.getTime())));
    const rangeEnd = new Date(Math.max(...doctorDayEnds.map((d) => d.getTime())));

    const groupSessions = await GroupSessionSlotRepository.listOverlappingForDoctor(
      doctor.id,
      rangeStart,
      rangeEnd
    );

    const slots = doctorDates.flatMap((doctorDate) =>
      ScheduleService.getAvailableSlots(settings, doctorDate, appointments, groupSessions)
    ).filter((slot) => {
      const start = new Date(slot.start);
      return start >= clientDayStart && start <= clientDayEnd;
    });

    res.json({ slots });
  },

  book: async (req: Request, res: Response) => {
    const { startTime, endTime, type } = req.body;
    const tz = req.user?.timezone ?? "UTC";
    const appointment = await AppointmentService.book(
      req.user!.id,
      parseDateTimeInTimezone(startTime, tz),
      parseDateTimeInTimezone(endTime, tz),
      type
    );
    res.status(201).json({ appointment });
  },

  listMine: async (req: Request, res: Response) => {
    const appointments = await AppointmentRepository.listByUser(req.user!.id);
    res.json({ appointments });
  },
  listDoctors: async (req: Request, res: Response) => {
    const doctors = await UserRepository.listDoctors();
    res.json({ doctors });
  },

  assign: async (req: Request, res: Response) => {
    const { doctorId } = req.body;
    if (!doctorId) throw new AppError("Doctor ID is required", 400, "BAD_REQUEST");
    
    const appointment = await AppointmentRepository.updateById(req.params.id, { doctorId });
    if (!appointment) throw new AppError("Appointment not found", 404, "NOT_FOUND");
    
    res.json({ appointment });
  },

  listAll: async (req: Request, res: Response) => {
    // Doctors see all appointments to allow reassignment
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    if (page !== undefined) {
      const result = await AppointmentRepository.listAllPaginated({
        page,
        limit,
        type: req.query.type as string,
        search: req.query.search as string,
        date: req.query.date as string,
        paymentStatus: req.query.paymentStatus as string,
        sessionStatus: req.query.sessionStatus as string,
        userTz: req.user?.timezone
      });
      res.json(result);
    } else {
      const appointments = await AppointmentRepository.listAll();
      res.json({ appointments });
    }
  },

  cancel: async (req: Request, res: Response) => {
    const appointment = await AppointmentService.cancel({ id: req.user!.id, role: req.user!.role }, req.params.id);
    res.json({ appointment });
  },

  reschedule: async (req: Request, res: Response) => {
    const { startTime, endTime } = req.body;
    const tz = req.user?.timezone ?? "UTC";
    const appointment = await AppointmentService.reschedule(
      { id: req.user!.id, role: req.user!.role },
      req.params.id,
      parseDateTimeInTimezone(startTime, tz),
      parseDateTimeInTimezone(endTime, tz)
    );
    res.json({ appointment });
  },

  getById: async (req: Request, res: Response) => {
    const appointment = await AppointmentRepository.findById(req.params.id);
    if (!appointment) throw new AppError("Not found", 404, "NOT_FOUND");
    res.json({ appointment });
  },

  updatePaymentStatus: async (req: Request, res: Response) => {
    const { status } = req.body;
    const appointment = await PaymentService.manualUpdatePaymentStatus(req.params.id, status);
    res.json({ appointment });
  },

  updateSessionStatus: async (req: Request, res: Response) => {
    const { status } = req.body;
    const appointment = await AppointmentRepository.updateById(req.params.id, { sessionStatus: status });
    if (!appointment) throw new AppError("Not found", 404, "NOT_FOUND");
    res.json({ appointment });
  },

  refreshPaymentStatus: async (req: Request, res: Response) => {
    const appointment = await PaymentService.refreshPaymentStatus(req.params.id);
    res.json({ appointment });
  }
};
