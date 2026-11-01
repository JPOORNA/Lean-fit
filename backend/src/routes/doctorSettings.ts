import { phoneSchema } from "../validators/contact";
import { DoctorNotificationService } from "../services/DoctorNotificationService";
import { z } from "zod";
import { whatsappTemplateKeys } from "../models/DoctorSettings";
import { WhatsAppTemplateService } from "../services/WhatsAppTemplateService";
import { DoctorSettings } from "../models/DoctorSettings";
import { Router } from "express";
import { DoctorSettingsController } from "../controllers/DoctorSettingsController";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";
import { upsertSchema, holidaySchema, breakSchema, blockSchema } from "../validators/doctorSettings";

const router = Router();

router.use(requireAuth);

const recipientRule = z.object({
  enabled: z.boolean(),
  emails: z.array(z.string().trim().toLowerCase().email("Enter a valid recipient email address.")).transform(values => [...new Set(values)]),
  whatsappNumbers: z.array(phoneSchema).transform(values => [...new Set(values)])
}).strict().refine(value => !value.enabled || value.emails.length + value.whatsappNumbers.length > 0, {
  message: "Add at least one email address or WhatsApp number, or turn this notification off."
});
const routingBody = z.object({
  events: z.object({
    bookingConfirmation: recipientRule, bookingReminder: recipientRule,
    subscriptionExpiry: recipientRule, mealUpload: recipientRule
  }).strict(),
  bookingReminderMinutes: z.number().int().min(5).max(10080),
  subscriptionReminderDays: z.number().int().min(0).max(30)
}).strict();
router.get("/notification-recipients", requireRole("doctor"), asyncHandler(async (_req, res) => {
  res.json({ routing: await DoctorNotificationService.getRouting(), deliveryStatus: await DoctorNotificationService.getDeliveryStatus() });
}));
router.put("/notification-recipients", requireRole("doctor"), validate(z.object({ body: routingBody })), asyncHandler(async (req, res) => {
  await DoctorSettings.findOneAndUpdate({}, { $set: { notificationRouting: req.body } }, { upsert: true, new: true, runValidators: true });
  res.json({ routing: await DoctorNotificationService.getRouting() });
}));

const templateName = z.string().trim().max(512).regex(/^[a-z0-9_]*$/, "Use lowercase letters, numbers and underscores, or leave blank to use the environment default.");
const templateNamesSchema = z.object({ body: z.object(Object.fromEntries(whatsappTemplateKeys.map(key => [key, templateName]))).strict() });
router.get("/whatsapp-templates", requireRole("doctor"), asyncHandler(async (_req, res) => {
  res.json(await WhatsAppTemplateService.getConfig());
}));
router.put("/whatsapp-templates", requireRole("doctor"), validate(templateNamesSchema), asyncHandler(async (req, res) => {
  await DoctorSettings.findOneAndUpdate({}, { $set: { whatsappTemplates: req.body } }, { upsert: true, new: true, runValidators: true });
  res.json(await WhatsAppTemplateService.getConfig());
}));

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
