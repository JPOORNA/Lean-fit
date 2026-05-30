import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/roles";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /dashboard/doctor-stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Doctor overview statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor stats
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoctorStats'
 */
router.get("/doctor-stats", requireRole("doctor"), asyncHandler(DashboardController.getDoctorStats));

/**
 * @openapi
 * /dashboard/recent-activities:
 *   get:
 *     tags: [Dashboard]
 *     summary: Recent activities across clients
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activities
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecentActivitiesResponse'
 */
router.get("/recent-activities", requireRole("doctor"), asyncHandler(DashboardController.getRecentActivities));

/**
 * @openapi
 * /dashboard/clients-daily-status:
 *   get:
 *     tags: [Dashboard]
 *     summary: Daily status for clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: date
 *         in: query
 *         required: false
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Clients daily status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientsDailyStatusResponse'
 */
router.get("/clients-daily-status", requireRole("doctor"), asyncHandler(DashboardController.getClientsDailyStatus));

/**
 * @openapi
 * /dashboard/client-stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Client personal stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client stats
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientStatsResponse'
 */
router.get("/client-stats", requireRole("client"), asyncHandler(DashboardController.getClientStats));

export { router as dashboardRoutes };
