import { Router } from "express";
import multer from "multer";
import { MealController } from "../controllers/MealController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { mealSchema, mealStatusSchema } from "../validators/meal";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth, requireRole("client"));

/**
 * @openapi
 * /meals:
 *   post:
 *     tags: [Meals]
 *     summary: Upload meal image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *               imageUrl: { type: string, nullable: true }
 *               notes: { type: string, nullable: true }
 *               takenAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Meal log created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MealResponse'
 */
router.post("/", upload.single("image"), validate(mealSchema), asyncHandler(MealController.create));

/**
 * @openapi
 * /meals/status:
 *   get:
 *     tags: [Meals]
 *     summary: Daily meal status for a date range
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         required: true
 *         schema: { type: string, format: date-time }
 *       - name: endDate
 *         in: query
 *         required: true
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Daily meal status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MealDayStatusListResponse'
 */
router.get("/status", validate(mealStatusSchema), asyncHandler(MealController.listDailyStatus));

/**
 * @openapi
 * /meals/me:
 *   get:
 *     tags: [Meals]
 *     summary: List my meal logs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Meal logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MealListResponse'
 */
router.get("/me", asyncHandler(MealController.listMine));

export { router as mealRoutes };
