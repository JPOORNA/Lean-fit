import { Router } from "express";
import { GroupSessionController } from "../controllers/GroupSessionController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { groupSessionBookSchema, groupSessionCreateSchema, groupSessionUpdateSchema } from "../validators/groupSessions";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /group-sessions:
 *   post:
 *     tags: [Group Sessions]
 *     summary: Create group session slot (doctor)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startTime, endTime, pricePaise, maxPeople]
 *             properties:
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *               pricePaise: { type: integer }
 *               maxPeople: { type: integer }
 *     responses:
 *       201:
 *         description: Group session slot created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupSessionSlotResponse'
 */
router.post("/", requireRole("doctor"), validate(groupSessionCreateSchema), asyncHandler(GroupSessionController.create));

/**
 * @openapi
 * /group-sessions:
 *   get:
 *     tags: [Group Sessions]
 *     summary: List group session slots (doctor)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group session slot list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupSessionSlotListResponse'
 */
router.get("/", requireRole("doctor"), asyncHandler(GroupSessionController.listMine));

/**
 * @openapi
 * /group-sessions/me:
 *   get:
 *     tags: [Group Sessions]
 *     summary: List my booked group sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group session slot list (my bookings)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MyBookingsResponse'
 */
router.get("/me", asyncHandler(GroupSessionController.listMyBookings));

/**
 * @openapi
 * /group-sessions/available:
 *   get:
 *     tags: [Group Sessions]
 *     summary: Get available group sessions for a date
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: date
 *         in: query
 *         required: true
 *         schema: { type: string, example: "2026-06-12" }
 *     responses:
 *       200:
 *         description: List of available group sessions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupSessionSlotListResponse'
 */
router.get("/available", asyncHandler(GroupSessionController.listAvailable));
/**
 * @openapi
 * /group-sessions/{id}/bookings:
 *   get:
 *     tags: [Group Sessions]
 *     summary: List bookings for a group session slot
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bookings list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingsListResponse'
 */
router.get("/:id/bookings", requireRole("doctor"), asyncHandler(GroupSessionController.listBookings));

/**
 * @openapi
 * /group-sessions/{id}:
 *   patch:
 *     tags: [Group Sessions]
 *     summary: Update group session pricing/capacity (doctor)
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
 *             required: [pricePaise, maxPeople]
 *             properties:
 *               pricePaise: { type: integer }
 *               maxPeople: { type: integer }
 *     responses:
 *       200:
 *         description: Group session slot updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupSessionSlotResponse'
 */
router.patch("/:id", requireRole("doctor"), validate(groupSessionUpdateSchema), asyncHandler(GroupSessionController.update));
router.patch("/:id/start", requireRole("doctor"), asyncHandler(GroupSessionController.start));
router.patch("/:id/end", requireRole("doctor"), asyncHandler(GroupSessionController.end));

/**
 * @openapi
 * /group-sessions/{id}/book:
 *   post:
 *     tags: [Group Sessions]
 *     summary: Book a group session slot (client)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group session slot booked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupSessionSlotResponse'
 */
router.post("/:id/book", requireRole("user", "client"), validate(groupSessionBookSchema), asyncHandler(GroupSessionController.book));

/**
 * @openapi
 * /group-sessions/{id}:
 *   delete:
 *     tags: [Group Sessions]
 *     summary: Delete a group session slot and optionally refund all booked clients (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *       - name: refundAll
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [true, false] }
 *     responses:
 *       200:
 *         description: Slot deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 */
router.delete("/:id", requireRole("doctor"), asyncHandler(GroupSessionController.deleteSlot));

/**
 * @openapi
 * /group-sessions/{id}/bookings/{userId}:
 *   delete:
 *     tags: [Group Sessions]
 *     summary: Remove a booking from a group session slot (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *       - name: refund
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [true, false] }
 *     responses:
 *       200:
 *         description: Booking removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 */
router.delete("/:id/bookings/:userId", requireRole("doctor"), asyncHandler(GroupSessionController.deleteBooking));

export { router as groupSessionRoutes };
