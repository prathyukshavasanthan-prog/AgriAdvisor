import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { 
  getNearbyOutbreaks, 
  getUserCommunityAlerts, 
  seedDemoOutbreaksForFarmer 
} from '../services/outbreakService.js';
import { Farm } from '../models/Farm.js';

const router = Router();

/**
 * GET /api/outbreaks/nearby?farmId=...&radiusKm=10
 * PART 3: Geospatial nearby query using MongoDB $geoNear
 * Returns reports from the last 14 days for the same crop, excluding the farmer's own farm.
 * Strictly returns distance in km, concern, days ago, safe guidance, and rough location.
 */
router.get('/nearby', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { farmId, radiusKm, cropType } = req.query;

    if (!farmId || typeof farmId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Query parameter "farmId" is required',
      });
      return;
    }

    const farm = await Farm.findById(farmId);
    if (!farm) {
      res.status(404).json({
        success: false,
        message: 'Farm not found',
      });
      return;
    }

    const radius = radiusKm ? Number(radiusKm) : 10;
    if (isNaN(radius) || radius <= 0) {
      res.status(400).json({
        success: false,
        message: 'radiusKm must be a positive number',
      });
      return;
    }

    const reports = await getNearbyOutbreaks(
      farmId, 
      radius, 
      cropType ? String(cropType) : undefined
    );

    res.status(200).json({
      success: true,
      count: reports.length,
      radiusKm: radius,
      farmId,
      farmName: farm.name,
      data: reports,
    });
  } catch (error: any) {
    console.error('[OutbreakRoutes] Error in /nearby:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch nearby outbreak reports',
    });
  }
});

/**
 * GET /api/outbreaks/community-alerts
 * PART 4: Alerts for Overview page across all of a farmer's registered plots.
 * Only triggers for farms growing a matching crop.
 */
router.get('/community-alerts', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const alerts = await getUserCommunityAlerts(req.user._id);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error: any) {
    console.error('[OutbreakRoutes] Error in /community-alerts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch community outbreak alerts',
    });
  }
});

/**
 * POST /api/outbreaks/seed-demo
 * PART 5: Adds 6 honest demo reports near the farmer's farm (marked isDemo: true)
 */
router.post('/seed-demo', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { farmId } = req.body;
    let targetFarmId = farmId;

    if (!targetFarmId) {
      // Find the first farm of the user
      const farm = await Farm.findOne({ user: req.user?._id });
      if (!farm) {
        res.status(404).json({
          success: false,
          message: 'No farm found for the cultivator to seed demo outbreaks around',
        });
        return;
      }
      targetFarmId = farm._id.toString();
    }

    const seeded = await seedDemoOutbreaksForFarmer(targetFarmId);

    res.status(201).json({
      success: true,
      message: 'Successfully seeded 6 demo outbreak reports near farm',
      farmId: targetFarmId,
      count: seeded.length,
      data: seeded,
    });
  } catch (error: any) {
    console.error('[OutbreakRoutes] Error seeding demo outbreaks:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to seed demo outbreak reports',
    });
  }
});

export default router;
