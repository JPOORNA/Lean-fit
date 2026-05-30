import { Router } from "express";
import { AppointmentController } from "../controllers/AppointmentController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { bookSchema, rescheduleSchema, updateStatusSchema } from "../validators/appointment";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /appointments/available-slots:
 *   get:
 *     tags: [Appointments]
 *     summary: Get available slots for a date
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: date
 *         in: query
 *         required: true
 *         schema: { type: string, example: "2026-05-01" }
 *     responses:
 *       200:
 *         description: List of slots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvailableSlotsResponse'
 *       400:
 *         description: Missing or invalid date
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Doctor or settings not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/available-slots", asyncHandler(AppointmentController.listAvailableSlots));

/**
 * @openapi
 * /appointments/book:
 *   post:
 *     tags: [Appointments]
 *     summary: Book appointment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startTime, endTime]
 *             properties:
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *               type: { type: string, enum: [one_off, client_session] }
 *     responses:
 *       201:
 *         description: Appointment created (pending payment)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
 *       400:
 *         description: Invalid timeslot or past date
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Slot conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/book", validate(bookSchema), asyncHandler(AppointmentController.book));

/**
 * @openapi
 * /appointments/me:
 *   get:
 *     tags: [Appointments]
 *     summary: List my appointments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointment list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentListResponse'
 */
router.get("/me", asyncHandler(AppointmentController.listMine));

/**
 * @openapi
 * /appointments/{id}/cancel:
 *   patch:
 *     tags: [Appointments]
 *     summary: Cancel appointment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Appointment cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
 */
router.patch("/:id/cancel", asyncHandler(AppointmentController.cancel));

/**
 * @openapi
 * /appointments/{id}/reschedule:
 *   patch:
 *     tags: [Appointments]
 *     summary: Reschedule appointment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startTime, endTime]
 *             properties:
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Appointment rescheduled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
 */
router.patch("/:id/reschedule", validate(rescheduleSchema), asyncHandler(AppointmentController.reschedule));

/**
 * @openapi
 * /appointments:
 *   get:
 *     tags: [Appointments]
 *     summary: List all appointments (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema: { type: integer, minimum: 1 }
 *       - name: limit
 *         in: query
 *         required: false
 *         schema: { type: integer, minimum: 1 }
 *       - name: type
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [one_off, client_session] }
 *       - name: search
 *         in: query
 *         required: false
 *         schema: { type: string }
 *       - name: date
 *         in: query
 *         required: false
 *         schema: { type: string, example: "2026-05-01" }
 *       - name: paymentStatus
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [pending, paid, failed, refunded] }
 *       - name: sessionStatus
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [scheduled, in_progress, completed, cancelled] }
 *     responses:
 *       200:
 *         description: Appointment list
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AppointmentListResponse'
 *                 - $ref: '#/components/schemas/AppointmentListPaginatedResponse'
 */
router.get("/", requireRole("doctor"), asyncHandler(AppointmentController.listAll));

/**
 * @openapi
 * /appointments/{id}:
 *   get:
 *     tags: [Appointments]
 *     summary: Get appointment by id (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Appointment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
 */

/**
 * @openapi
 * /appointments/doctors:
 *   get:
 *     tags: [Appointments]
 *     summary: List doctors for appointment assignment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoctorListResponse'
 */
router.get("/doctors", requireRole("doctor"), asyncHandler(AppointmentController.listDoctors));
router.get("/:id", requireRole("doctor"), asyncHandler(AppointmentController.getById));

/**
 * @openapi
 * /appointments/{id}/payment-status:
 *   patch:
 *     tags: [Appointments]
 *     summary: Update payment status (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, paid, failed, refunded] }
 *     responses:
 *       200:
 *         description: Payment status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
 *       400:
 *         description: Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:id/payment-status", requireRole("doctor"), asyncHandler(AppointmentController.updatePaymentStatus));

/**
 * @openapi
 * /appointments/{id}/session-status:
 *   patch:
 *     tags: [Appointments]
 *     summary: Update session status (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [scheduled, in_progress, completed, cancelled] }
 *     responses:
 *       200:
 *         description: Session status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
 */
router.patch("/:id/session-status", requireRole("doctor"), asyncHandler(AppointmentController.updateSessionStatus));

/**
 * @openapi
 * /appointments/{id}/payment-status/refresh:
 *   patch:
 *     tags: [Appointments]
 *     summary: Refresh payment status from Razorpay
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment status refreshed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
 */
router.patch("/:id/payment-status/refresh", asyncHandler(AppointmentController.refreshPaymentStatus));


/**
 * @openapi
 * /appointments/{id}/assign:
 *   patch:
 *     tags: [Appointments]
 *     summary: Assign appointment to a doctor (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId]
 *             properties:
 *               doctorId: { type: string }
 *     responses:
 *       200:
 *         description: Appointment assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
 */
router.patch("/:id/assign", requireRole("doctor"), asyncHandler(AppointmentController.assign));

export { router as appointmentRoutes };
