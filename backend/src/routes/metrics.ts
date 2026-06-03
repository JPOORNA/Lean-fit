import { Router } from "express";
import { MetricsController } from "../controllers/MetricsController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { metricsSchema } from "../validators/metrics";

const router = Router();

router.use(requireAuth, requireRole("client"));

/**
 * @openapi
 * /metrics:
 *   post:
 *     tags: [Metrics]
 *     summary: Upsert weekly body metrics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [weekStartDate, weight, height, bmi]
 *             properties:
 *               weekStartDate: { type: string, format: date-time }
 *               weight: { type: number }
 *               height: { type: number }
 *               bmi: { type: number }
 *               extraFields: { type: object, additionalProperties: true }
 *     responses:
 *       200:
 *         description: Metrics saved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BodyMetricsResponse'
 */
router.post("/", validate(metricsSchema), asyncHandler(MetricsController.upsert));

/**
 * @openapi
 * /metrics/me:
 *   get:
 *     tags: [Metrics]
 *     summary: List my body metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BodyMetricsListResponse'
 */
router.get("/me", asyncHandler(MetricsController.listMine));

export { router as metricsRoutes };
