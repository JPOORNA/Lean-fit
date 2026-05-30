import { Router } from "express";
import { WorkoutController } from "../controllers/WorkoutController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { workoutSchema } from "../validators/workout";

const router = Router();

router.use(requireAuth, requireRole("client"));

/**
 * @openapi
 * /workouts:
 *   post:
 *     tags: [Workouts]
 *     summary: Upsert workout log
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, attended]
 *             properties:
 *               date: { type: string, format: date-time }
 *               attended: { type: boolean }
 *               notes: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Workout log saved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutLogResponse'
 */
router.post("/", validate(workoutSchema), asyncHandler(WorkoutController.upsert));

/**
 * @openapi
 * /workouts/me:
 *   get:
 *     tags: [Workouts]
 *     summary: List my workout logs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workout logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutLogsListResponse'
 */
router.get("/me", asyncHandler(WorkoutController.listMine));

export { router as workoutRoutes };
