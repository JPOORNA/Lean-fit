import { Router } from "express";
import { DoctorSettingsController } from "../controllers/DoctorSettingsController";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";
import { upsertSchema, holidaySchema, breakSchema, blockSchema } from "../validators/doctorSettings";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /doctor-settings/public:
 *   get:
 *     tags: [DoctorSettings]
 *     summary: Get public doctor settings (dynamic metrics, etc.)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Public Settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoctorSettingsResponse'
 */
router.get("/public", asyncHandler(DoctorSettingsController.getPublicSettings));

/**
 * @openapi
 * /doctor-settings:
 *   get:
 *     tags: [DoctorSettings]
 *     summary: Get doctor settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoctorSettingsResponse'
 */
router.get("/", requireRole("doctor"), asyncHandler(DoctorSettingsController.getSettings));

/**
 * @openapi
 * /doctor-settings:
 *   put:
 *     tags: [DoctorSettings]
 *     summary: Update doctor settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timezone: { type: string, example: "Asia/Kolkata" }
 *               weeklyAvailability:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek: { type: integer, minimum: 0, maximum: 6 }
 *                     workingHours:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           start: { type: string, example: "09:00" }
 *                           end: { type: string, example: "17:00" }
 *               breaks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek: { type: integer }
 *                     start: { type: string, example: "13:00" }
 *                     end: { type: string, example: "14:00" }
 *               holidays:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     date: { type: string, example: "2026-05-01" }
 *                     isFullDay: { type: boolean }
 *                     start: { type: string, nullable: true }
 *                     end: { type: string, nullable: true }
 *                     note: { type: string, nullable: true }
 *               blockedSlots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     start: { type: string, format: date-time }
 *                     end: { type: string, format: date-time }
 *                     reason: { type: string, nullable: true }
 *               defaultSlotDurationMinutes: { type: integer, example: 30 }
 *               appointmentFeePaise: { type: integer, example: 50000 }
 *               dynamicMetricFields:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key: { type: string }
 *                     label: { type: string }
 *                     type: { type: string, enum: [number, text] }
 *     responses:
 *       200:
 *         description: Settings updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoctorSettingsResponse'
 */
router.put("/", requireRole("doctor"), validate(upsertSchema), asyncHandler(DoctorSettingsController.upsertSettings));

/**
 * @openapi
 * /doctor-settings/holidays:
 *   post:
 *     tags: [DoctorSettings]
 *     summary: Add holiday
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, isFullDay]
 *             properties:
 *               date: { type: string, example: "2026-05-01" }
 *               isFullDay: { type: boolean }
 *               start: { type: string, nullable: true }
 *               end: { type: string, nullable: true }
 *               note: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Holiday added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoctorSettingsResponse'
 */
router.post("/holidays", requireRole("doctor"), validate(holidaySchema), asyncHandler(DoctorSettingsController.addHoliday));

/**
 * @openapi
 * /doctor-settings/breaks:
 *   post:
 *     tags: [DoctorSettings]
 *     summary: Add break
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dayOfWeek, start, end]
 *             properties:
 *               dayOfWeek: { type: integer, minimum: 0, maximum: 6 }
 *               start: { type: string, example: "13:00" }
 *               end: { type: string, example: "14:00" }
 *     responses:
 *       200:
 *         description: Break added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoctorSettingsResponse'
 */
router.post("/breaks", requireRole("doctor"), validate(breakSchema), asyncHandler(DoctorSettingsController.addBreak));

/**
 * @openapi
 * /doctor-settings/blocks:
 *   post:
 *     tags: [DoctorSettings]
 *     summary: Block a time slot
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [start, end]
 *             properties:
 *               start: { type: string, format: date-time }
 *               end: { type: string, format: date-time }
 *               reason: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Block added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoctorSettingsResponse'
 */
router.post("/blocks", requireRole("doctor"), validate(blockSchema), asyncHandler(DoctorSettingsController.blockSlot));

export { router as doctorSettingsRoutes };
