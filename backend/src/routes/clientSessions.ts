import { Router } from "express";
import { ClientSessionController } from "../controllers/ClientSessionController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { clientSessionSchema, clientSessionUpdateSchema } from "../validators/clientSessions";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /client-sessions:
 *   post:
 *     tags: [Client Sessions]
 *     summary: Create client session schedule (doctor)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, daysOfWeek, timeSlots, startDate]
 *             properties:
 *               userId: { type: string }
 *               daysOfWeek:
 *                 type: array
 *                 items: { type: integer, minimum: 0, maximum: 6 }
 *                 minItems: 3
 *                 maxItems: 3
 *               timeSlots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek: { type: integer, minimum: 0, maximum: 6 }
 *                     startTime: { type: string, example: "09:00" }
 *                     endTime: { type: string, example: "09:30" }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time, nullable: true }
 *     responses:
 *       201:
 *         description: Client session schedule created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientSessionScheduleResponse'
 */
router.post("/", requireRole("doctor"), validate(clientSessionSchema), asyncHandler(ClientSessionController.create));
/**
 * @openapi
 * /client-sessions:
 *   get:
 *     tags: [Client Sessions]
 *     summary: List client session schedules (doctor)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedules
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientSessionSchedulesResponse'
 */
router.get("/", requireRole("doctor"), asyncHandler(ClientSessionController.listAll));

/**
 * @openapi
 * /client-sessions/{id}:
 *   patch:
 *     tags: [Client Sessions]
 *     summary: Update client session schedule (doctor)
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
 *             required: [daysOfWeek, timeSlots, startDate]
 *             properties:
 *               daysOfWeek:
 *                 type: array
 *                 items: { type: integer, minimum: 0, maximum: 6 }
 *                 minItems: 3
 *                 maxItems: 3
 *               timeSlots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek: { type: integer, minimum: 0, maximum: 6 }
 *                     startTime: { type: string, example: "09:00" }
 *                     endTime: { type: string, example: "09:30" }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200:
 *         description: Client session schedule updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientSessionScheduleResponse'
 */
router.patch("/:id", requireRole("doctor"), validate(clientSessionUpdateSchema), asyncHandler(ClientSessionController.update));

/**
 * @openapi
 * /client-sessions/me:
 *   get:
 *     tags: [Client Sessions]
 *     summary: List my client session schedules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedules
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientSessionSchedulesResponse'
 */
router.get("/me", requireRole("client"), asyncHandler(ClientSessionController.listMine));

/**
 * @openapi
 * /client-sessions/client/{userId}:
 *   get:
 *     tags: [Client Sessions]
 *     summary: List client session schedules for a specific client (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Schedules
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientSessionSchedulesResponse'
 */
router.get("/client/:userId", requireRole("doctor"), asyncHandler(ClientSessionController.listByClient));

export { router as clientSessionRoutes };
