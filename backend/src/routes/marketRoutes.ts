import { Router, Request, Response } from 'express';
import { getMarketTrendForCrop, getNearbyMandisWithPrices } from '../services/marketService.js';

const router = Router();

/**
 * GET /api/market
 * Returns current price + trend for all commodities or queried crops (?crops=wheat,rice,...)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const cropsParam = req.query.crops as string;
    const defaultCrops = ['wheat', 'rice', 'cotton', 'chickpea', 'tomato', 'potato', 'onion', 'mustard'];
    const cropsToFetch = cropsParam
      ? cropsParam.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean)
      : defaultCrops;

    const results = await Promise.all(
      cropsToFetch.map(async (crop) => {
        try {
          return await getMarketTrendForCrop(crop);
        } catch (err) {
          return null;
        }
      })
    );

    const validResults = results.filter(Boolean);
    res.status(200).json({
      success: true,
      data: validResults,
    });
  } catch (error: any) {
    console.error('[Market Route] Error fetching batch market trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve market trends',
      error: error.message,
    });
  }
});

/**
 * GET /api/market/mandis
 * Retrieve authentic APMC mandis with prices for a crop and distance calculations
 * Query params: ?crop=wheat&lat=28.7&lng=77.1&farmId=...
 */
router.get('/mandis', async (req: Request, res: Response): Promise<void> => {
  try {
    const crop = (req.query.crop as string) || 'wheat';
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const farmId = (req.query.farmId as string) || undefined;

    const result = await getNearbyMandisWithPrices({
      cropType: crop,
      farmLat: lat,
      farmLng: lng,
      farmId,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Market Route] Error fetching nearby mandis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve mandi market information',
      error: error.message,
    });
  }
});

/**
 * GET /api/market/:cropType
 * Returns current price + recent 7-14 day trend for a specific crop
 */
router.get('/:cropType', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cropType } = req.params;
    if (!cropType || cropType.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Crop type parameter is required',
      });
      return;
    }

    const trend = await getMarketTrendForCrop(cropType);

    res.status(200).json({
      success: true,
      data: trend,
    });
  } catch (error: any) {
    console.error(`[Market Route] Error fetching trend for ${req.params.cropType}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to retrieve market data for ${req.params.cropType}`,
      error: error.message,
    });
  }
});

export default router;
