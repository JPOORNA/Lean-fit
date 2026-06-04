import { Router } from "express";
import multer from "multer";
import { PlanController } from "../controllers/PlanController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { dietPlanUploadSchema, workoutPlanUploadSchema } from "../validators/plan";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth);

/**
 * @openapi
 * /plans/me/diet:
 *   get:
 *     tags: [Plans]
 *     summary: List my diet plans
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Diet plans
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DietPlanListResponse'
 */
router.get("/me/diet", asyncHandler(PlanController.listMyDietPlans));

/**
 * @openapi
 * /plans/me/workout:
 *   get:
 *     tags: [Plans]
 *     summary: List my workout plans
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workout plans
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutPlanListResponse'
 */
router.get("/me/workout", asyncHandler(PlanController.listMyWorkoutPlans));

/**
 * @openapi
 * /plans/diet/assign/{userId}:
 *   post:
 *     tags: [Plans]
 *     summary: Upload diet plan PDF (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pdf: { type: string, format: binary }
 *               fileUrl: { type: string, nullable: true }
 *               name: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *               startDate: { type: string, format: date-time, nullable: true }
 *               endDate: { type: string, format: date-time, nullable: true }
 *     responses:
 *       201:
 *         description: Diet plan assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DietPlanResponse'
 */
router.post(
	"/diet/assign/:userId",
	requireRole("doctor"),
	upload.single("pdf"),
	validate(dietPlanUploadSchema),
	asyncHandler(PlanController.assignDietPlan)
);

/**
 * @openapi
 * /plans/workout/assign/{userId}:
 *   post:
 *     tags: [Plans]
 *     summary: Upload workout plan PDF (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pdf: { type: string, format: binary }
 *               fileUrl: { type: string, nullable: true }
 *               name: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *               startDate: { type: string, format: date-time, nullable: true }
 *               endDate: { type: string, format: date-time, nullable: true }
 *     responses:
 *       201:
 *         description: Workout plan assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutPlanResponse'
 */
router.post(
	"/workout/assign/:userId",
	requireRole("doctor"),
	upload.single("pdf"),
	validate(workoutPlanUploadSchema),
	asyncHandler(PlanController.assignWorkoutPlan)
);

/**
 * @openapi
 * /plans/diet/{id}:
 *   patch:
 *     tags: [Plans]
 *     summary: Update a diet plan (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pdf: { type: string, format: binary }
 *               name: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Plan updated
 */
router.patch(
	"/diet/:id",
	requireRole("doctor"),
	upload.single("pdf"),
	validate(dietPlanUploadSchema),
	asyncHandler(PlanController.updateDietPlan)
);

/**
 * @openapi
 * /plans/diet/{id}:
 *   delete:
 *     tags: [Plans]
 *     summary: Delete a diet plan (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Plan deleted
 */
router.delete(
	"/diet/:id",
	requireRole("doctor"),
	asyncHandler(PlanController.deleteDietPlan)
);

/**
 * @openapi
 * /plans/workout/{id}:
 *   patch:
 *     tags: [Plans]
 *     summary: Update a workout plan (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pdf: { type: string, format: binary }
 *               name: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Plan updated
 */
router.patch(
	"/workout/:id",
	requireRole("doctor"),
	upload.single("pdf"),
	validate(workoutPlanUploadSchema),
	asyncHandler(PlanController.updateWorkoutPlan)
);

/**
 * @openapi
 * /plans/workout/{id}:
 *   delete:
 *     tags: [Plans]
 *     summary: Delete a workout plan (doctor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Plan deleted
 */
router.delete(
	"/workout/:id",
	requireRole("doctor"),
	asyncHandler(PlanController.deleteWorkoutPlan)
);

export { router as planRoutes };
