import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Farm } from '../models/Farm.js';
import { Crop } from '../models/Crop.js';
import { CropHealthLog } from '../models/CropHealthLog.js';
import { getWeatherData } from '../services/weatherService.js';
import { predictCrop, predictIrrigation, predictCropHealth } from '../services/mlClient.js';
import { getSoilDefaults } from '../services/soilDefaults.js';
import {
  farmCreateSchema,
  farmUpdateSchema,
  cropCreateSchema,
  cropUpdateSchema,
  cropRecommendSchema,
  cropHealthLogCreateSchema,
} from '../validators/farmSchemas.js';
import {
  createHealthLog,
  getHealthLogsForCrop,
  getUserHealthAlerts,
} from '../services/cropHealthService.js';
import {
  calculateCropLifecycle,
  getSowingAdvisory,
} from '../services/cropLifecycleService.js';
import { Types } from 'mongoose';

const router = Router();

// Protect all farm routes
router.use(authenticateToken);

// ==========================================
// 1. RECOMMENDATION & ALERT ENDPOINTS (Specific routes before :id)
// ==========================================

/**
 * GET /api/farms/health-alerts
 * Fetch active health alerts across all crops owned by the logged-in cultivator
 * (Alerts if 2+ consecutive "Concerning" logs are recorded)
 */
router.get('/health-alerts', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const alerts = await getUserHealthAlerts(req.user?._id!);
    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error: any) {
    console.error('[Farm Route] Error fetching crop health alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve health alerts',
      error: error.message,
    });
  }
});

/**
 * GET /api/farms/gis-map
 * Fetch all farms for the cultivator with enriched GIS coordinates,
 * latest AI health status, irrigation advisory, and color/icon status code:
 * - 'optimal' (Green + Checkmark): Urgency is 'Low' AND latest health is 'Healthy'
 * - 'warning' (Amber + Warning Icon): Urgency is 'Medium' OR latest health is 'Okay'
 * - 'critical' (Red + Alert Icon): Urgency is 'High' OR latest health is 'Concerning' OR AI detected disease
 * - 'unknown' (Grey + Question Icon): No recommendation or health data available yet
 */
router.get('/gis-map', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const farms = await Farm.find({ user: req.user?._id }).sort({ created_at: -1 }).lean();

    const farmIds = farms.map((f) => f._id);
    const crops = await Crop.find({ farm: { $in: farmIds } }).sort({ created_at: -1 }).lean();

    const cropsByFarm = crops.reduce((acc: Record<string, any[]>, crop) => {
      const fId = crop.farm.toString();
      if (!acc[fId]) acc[fId] = [];
      acc[fId].push(crop);
      return acc;
    }, {});

    // Fetch latest crop health logs for each farm
    const latestHealthLogs = await CropHealthLog.aggregate([
      { $match: { farm_id: { $in: farmIds } } },
      { $sort: { date: -1, logged_at: -1 } },
      {
        $group: {
          _id: '$farm_id',
          latest: { $first: '$$ROOT' },
        },
      },
    ]);

    const healthLogMap = latestHealthLogs.reduce((acc: Record<string, any>, item) => {
      acc[item._id.toString()] = item.latest;
      return acc;
    }, {});

    const mapFarms = await Promise.all(
      farms.map(async (farm) => {
        const farmIdStr = farm._id.toString();
        const activeCrop = cropsByFarm[farmIdStr]?.[0] || null;
        const latestHealth = healthLogMap[farmIdStr] || null;

        // Coordinate validity check
        const hasValidCoords =
          typeof farm.latitude === 'number' &&
          typeof farm.longitude === 'number' &&
          !isNaN(farm.latitude) &&
          !isNaN(farm.longitude) &&
          (farm.latitude !== 0 || farm.longitude !== 0) &&
          farm.latitude >= -90 &&
          farm.latitude <= 90 &&
          farm.longitude >= -180 &&
          farm.longitude <= 180;

        let irrigation: {
          available: boolean;
          urgency_level?: string;
          recommended_action?: string;
          actionKey?: string;
          urgencyKey?: string;
        } = { available: false };

        let weatherData: any = null;
        if (hasValidCoords) {
          try {
            weatherData = await getWeatherData(farm.latitude, farm.longitude, farm._id);
          } catch (wErr) {
            console.warn('[GIS Map] Weather fetch skipped/failed:', wErr);
          }
        }

        if (hasValidCoords && activeCrop && weatherData) {
          try {
            const daysSinceRain = weatherData.precipitation > 0.5 ? 0 : 4;
            const daysSinceSowing = activeCrop.sowing_date
              ? Math.max(0, Math.floor((Date.now() - new Date(activeCrop.sowing_date).getTime()) / 86400000))
              : 5;
            const daysSinceLastIrrigation = (daysSinceSowing <= 2) ? 1 : Math.min(6, Math.max(2, (daysSinceSowing % 7) || 4));
            const pred = await predictIrrigation({
              days_since_rain: daysSinceRain,
              days_since_last_irrigation: daysSinceLastIrrigation,
              soil_type: farm.soil_type,
              forecast_rain_probability: weatherData.forecast_rain_probability,
              forecast_rain_amount: weatherData.forecast_rain_amount,
              crop_type: activeCrop.crop_type,
              userId: req.user?._id,
              farmId: farm._id,
            });

            if (pred.available && pred.urgency_level) {
              irrigation = {
                available: true,
                urgency_level: pred.urgency_level,
                recommended_action: pred.recommended_action,
                actionKey: `action_${pred.recommended_action!.toLowerCase().replace(/\s+/g, '_')}`,
                urgencyKey: `urgency_${pred.urgency_level!.toLowerCase()}`,
              };
            }
          } catch (e) {
            irrigation = { available: false };
          }
        }

        // Status Determination logic (Part 2 mandate):
        // Green: irrigation urgency is "Low" AND latest crop health check (manual or AI) is "Healthy"
        // Amber: irrigation urgency is "Medium" OR latest crop health check is "Okay"
        // Red: irrigation urgency is "High" OR latest crop health check is "Concerning" OR AI diagnosis found a disease
        // Grey: no recommendation data available yet for that farm (e.g. AI service unreachable, or farm just created)
        const urgency = irrigation.available ? irrigation.urgency_level : null;
        const healthStatus = latestHealth ? latestHealth.health_status : null;
        const isDisease = latestHealth?.ai_prediction
          ? latestHealth.ai_prediction.is_healthy === false
          : false;

        let status: 'optimal' | 'warning' | 'critical' | 'unknown' = 'unknown';

        if (urgency === 'High' || healthStatus === 'Concerning' || isDisease) {
          status = 'critical';
        } else if (urgency === 'Medium' || healthStatus === 'Okay') {
          status = 'warning';
        } else if (urgency === 'Low' && healthStatus === 'Healthy') {
          status = 'optimal';
        } else {
          status = 'unknown';
        }

        return {
          id: farm._id,
          name: farm.name,
          latitude: farm.latitude,
          longitude: farm.longitude,
          has_valid_coordinates: hasValidCoords,
          area: farm.area,
          boundary: (farm.boundary && farm.boundary.coordinates && farm.boundary.coordinates.length > 0) ? farm.boundary : null,
          soil_type: farm.soil_type,
          weather: {
            forecast_rain_probability: weatherData?.forecast_rain_probability ?? 0,
            forecast_rain_amount: weatherData?.forecast_rain_amount ?? 0,
            temperature: weatherData?.temperature ?? 28,
            humidity: weatherData?.humidity ?? 65,
          },
          crop: activeCrop
            ? {
                id: activeCrop._id,
                crop_type: activeCrop.crop_type,
                status: activeCrop.status,
                sowing_date: activeCrop.sowing_date,
              }
            : null,
          health: latestHealth
            ? {
                status: latestHealth.health_status,
                check_in_type: latestHealth.check_in_type || 'manual',
                notes: latestHealth.notes,
                date: latestHealth.date,
                ai_predicted_class: latestHealth.ai_prediction?.predicted_class,
              }
            : null,
          irrigation,
          status,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: mapFarms.length,
      valid_coordinates_count: mapFarms.filter((f) => f.has_valid_coordinates).length,
      invalid_coordinates_count: mapFarms.filter((f) => !f.has_valid_coordinates).length,
      data: mapFarms,
    });
  } catch (error: any) {
    console.error('[Farm Route] Error fetching GIS map data:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve GIS map data' });
  }
});

/**
 * POST /api/farms/recommend-crop
 * Suggest optimal crop based on soil test parameters and local climate
 * Supports both Soil Health Card parameters and representative Soil Type defaults
 */
router.post('/recommend-crop', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = cropRecommendSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid soil or climate parameters',
        errors: parseResult.error.errors,
      });
      return;
    }

    let { soil_n, soil_p, soil_k, soil_ph, soil_type, latitude, longitude } = parseResult.data;

    // If farmer does not have a Soil Health Card or values omitted,
    // look up representative ICAR benchmark averages from soil_type
    if (soil_n === undefined || soil_p === undefined || soil_k === undefined || soil_ph === undefined) {
      const defaults = getSoilDefaults(soil_type || 'loamy');
      soil_n = soil_n ?? defaults.n;
      soil_p = soil_p ?? defaults.p;
      soil_k = soil_k ?? defaults.k;
      soil_ph = soil_ph ?? defaults.ph;
    }

    let temperature = parseResult.data.temperature;
    let humidity = parseResult.data.humidity;
    let rainfall = parseResult.data.rainfall;

    // If coordinates are provided and weather features not explicitly supplied, fetch real local weather
    if (latitude !== undefined && longitude !== undefined && (temperature === undefined || humidity === undefined)) {
      try {
        const weather = await getWeatherData(latitude, longitude);
        temperature = temperature ?? weather.temperature;
        humidity = humidity ?? weather.humidity;
        rainfall = rainfall ?? (weather.precipitation > 0 ? weather.precipitation * 10 : 85);
      } catch (wErr) {
        console.warn('[Farm Route] Weather fetch for crop recommendation skipped:', wErr);
      }
    }

    // Default sensible climate if still undefined
    temperature = temperature ?? 26.5;
    humidity = humidity ?? 71.0;
    rainfall = rainfall ?? 110.0;

    const prediction = await predictCrop({
      N: soil_n,
      P: soil_p,
      K: soil_k,
      temperature,
      humidity,
      ph: soil_ph,
      rainfall,
      userId: req.user?._id,
    });

    if (!prediction.available) {
      res.status(200).json({
        success: true,
        available: false,
        messageKey: prediction.messageKey || 'ai_crop_unavailable',
        error: prediction.error,
      });
      return;
    }

    // Sowing Window & Land Preparation Advisory (Module 6)
    const refDate = (req.body as any).simulated_date || req.query.date
      ? new Date(String((req.body as any).simulated_date || req.query.date))
      : new Date();
    const sowingAdvisory = getSowingAdvisory(prediction.recommended_crop || 'rice', refDate);
    const alternativesAdvisory = (prediction.alternatives || []).map((alt: string) =>
      getSowingAdvisory(alt, refDate)
    );

    res.status(200).json({
      success: true,
      available: true,
      recommended_crop: prediction.recommended_crop,
      confidence: prediction.confidence,
      confidence_score: prediction.confidence_score,
      alternatives: prediction.alternatives,
      trained_on: prediction.trained_on,
      climate_snapshot: { temperature, humidity, rainfall },
      sowing_advisory: sowingAdvisory,
      alternatives_advisory: alternativesAdvisory,
    });
  } catch (error: any) {
    console.error('[Farm Route] Crop recommendation error:', error);
    res.status(500).json({
      success: false,
      available: false,
      messageKey: 'ai_crop_unavailable',
      message: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/farms/:farmId/recommendation (or mapped from /api/recommendations/:farmId)
 * Predict irrigation urgency and action using Model 2 with real-time weather
 */
export const getFarmIrrigationRecommendation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { farmId } = req.params;

    if (!Types.ObjectId.isValid(farmId)) {
      res.status(400).json({ success: false, message: 'Invalid farm ID' });
      return;
    }

    const farm = await Farm.findOne({ _id: farmId, user: req.user?._id });
    if (!farm) {
      res.status(404).json({ success: false, message: 'Farm not found' });
      return;
    }

    // Find active or latest crop
    const latestCrop = await Crop.findOne({ farm: farm._id }).sort({ created_at: -1 });
    const cropType = latestCrop?.crop_type || 'wheat';

    // Fetch current weather via Open-Meteo + Redis caching
    const weather = await getWeatherData(farm.latitude, farm.longitude, farm._id);

    // Domain estimation: if recent precipitation recorded, days_since_rain is 0; else 4
    const daysSinceRain = weather.precipitation > 0.5 ? 0 : 4;
    const daysSinceLastIrrigation = 5; // standard interval benchmark

    const prediction = await predictIrrigation({
      days_since_rain: daysSinceRain,
      days_since_last_irrigation: daysSinceLastIrrigation,
      soil_type: farm.soil_type,
      forecast_rain_probability: weather.forecast_rain_probability,
      forecast_rain_amount: weather.forecast_rain_amount,
      crop_type: cropType,
      userId: req.user?._id,
      farmId: farm._id,
    });

    if (!prediction.available) {
      // Neutral "unavailable" state with zero rule-based fallback
      res.status(200).json({
        success: true,
        available: false,
        messageKey: prediction.messageKey || 'ai_insights_unavailable',
        message: 'AI recommendation service is temporarily unavailable.',
        weather: {
          temperature: weather.temperature,
          humidity: weather.humidity,
          precipitation: weather.precipitation,
          wind_speed: weather.wind_speed,
          source: weather.source,
        },
      });
      return;
    }

    const actionKey = `action_${prediction.recommended_action!.toLowerCase().replace(/\s+/g, '_')}`;
    const urgencyKey = `urgency_${prediction.urgency_level!.toLowerCase()}`;

    res.status(200).json({
      success: true,
      available: true,
      recommended_action: prediction.recommended_action,
      urgency_level: prediction.urgency_level,
      confidence: prediction.confidence,
      confidence_score: prediction.confidence_score,
      top_reasons: prediction.top_reasons,
      trained_on: prediction.trained_on,
      messageKey: actionKey,
      urgencyKey: urgencyKey,
      weather: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        precipitation: weather.precipitation,
        wind_speed: weather.wind_speed,
        forecast_rain_probability: weather.forecast_rain_probability,
        forecast_rain_amount: weather.forecast_rain_amount,
        source: weather.source,
      },
    });
  } catch (error: any) {
    console.error('[Farm Route] Irrigation recommendation error:', error);
    res.status(200).json({
      success: true,
      available: false,
      messageKey: 'ai_insights_unavailable',
      message: 'AI recommendation service is temporarily unavailable.',
    });
  }
};

router.get('/:farmId/recommendation', getFarmIrrigationRecommendation);

// ==========================================
// 2. FARMS CRUD ENDPOINTS
// ==========================================

/**
 * GET /api/farms
 * List all farms for logged-in user with active crops
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const farms = await Farm.find({ user: req.user?._id }).sort({ created_at: -1 }).lean();

    // Attach crops to each farm
    const farmIds = farms.map((f) => f._id);
    const crops = await Crop.find({ farm: { $in: farmIds } }).sort({ created_at: -1 }).lean();

    const cropsByFarm = crops.reduce((acc: Record<string, any[]>, crop) => {
      const fId = crop.farm.toString();
      if (!acc[fId]) acc[fId] = [];
      acc[fId].push(crop);
      return acc;
    }, {});

    const enrichedFarms = farms.map((farm) => ({
      ...farm,
      crops: cropsByFarm[farm._id.toString()] || [],
      activeCrop: cropsByFarm[farm._id.toString()]?.[0] || null,
    }));

    res.status(200).json({
      success: true,
      count: enrichedFarms.length,
      data: enrichedFarms,
    });
  } catch (error: any) {
    console.error('[Farm Route] Error fetching farms:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve farms' });
  }
});

/**
 * GET /api/farms/:id
 * Retrieve farm details, crops, and live weather snapshot
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid farm ID' });
      return;
    }

    const farm = await Farm.findOne({ _id: id, user: req.user?._id }).lean();
    if (!farm) {
      res.status(404).json({ success: false, message: 'Farm not found' });
      return;
    }

    const crops = await Crop.find({ farm: farm._id }).sort({ created_at: -1 }).lean();

    // Fetch live weather data
    let weather = null;
    try {
      weather = await getWeatherData(farm.latitude, farm.longitude, farm._id);
    } catch (wErr) {
      console.warn('[Farm Route] Weather fetch error for farm detail:', wErr);
    }

    res.status(200).json({
      success: true,
      data: {
        ...farm,
        crops,
        activeCrop: crops[0] || null,
        weather,
      },
    });
  } catch (error: any) {
    console.error('[Farm Route] Error retrieving farm details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve farm details' });
  }
});

/**
 * POST /api/farms
 * Create a new farm and optional initial crop
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = farmCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid farm input data',
        errors: parseResult.error.errors,
      });
      return;
    }

    const farmInput: any = { ...parseResult.data };
    const defaults = getSoilDefaults(farmInput.soil_type || 'loamy');

    // If farmer does not have a Soil Health Card, enforce realistic ICAR benchmark values
    if (!farmInput.soil_health_card) {
      farmInput.soil_n = defaults.n;
      farmInput.soil_p = defaults.p;
      farmInput.soil_k = defaults.k;
      farmInput.soil_ph = defaults.ph;
    } else {
      // If Soil Health Card is true but individual values omitted, fallback to defaults
      farmInput.soil_n = farmInput.soil_n ?? defaults.n;
      farmInput.soil_p = farmInput.soil_p ?? defaults.p;
      farmInput.soil_k = farmInput.soil_k ?? defaults.k;
      farmInput.soil_ph = farmInput.soil_ph ?? defaults.ph;
    }

    const farm = await Farm.create({
      ...farmInput,
      user: req.user?._id,
    });

    // If an initial crop was optionally included in the creation payload
    let createdCrop = null;
    if (req.body.crop && req.body.crop.crop_type) {
      try {
        const cropParsed = cropCreateSchema.safeParse(req.body.crop);
        if (cropParsed.success) {
          const sowingDate = new Date(cropParsed.data.sowing_date);
          const lifecycle = calculateCropLifecycle({
            crop_type: cropParsed.data.crop_type,
            sowing_date: sowingDate,
            expected_harvest_date: cropParsed.data.expected_harvest_date,
          });
          createdCrop = await Crop.create({
            ...cropParsed.data,
            expected_harvest_date: cropParsed.data.expected_harvest_date || lifecycle.expected_harvest_date,
            current_growth_stage: lifecycle.current_stage.stage_name,
            farm: farm._id,
          });
        }
      } catch (cErr) {
        console.warn('[Farm Route] Optional crop creation failed:', cErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Farm created successfully',
      data: {
        ...farm.toObject(),
        crops: createdCrop ? [createdCrop.toObject()] : [],
        activeCrop: createdCrop ? createdCrop.toObject() : null,
      },
    });
  } catch (error: any) {
    console.error('[Farm Route] Error creating farm:', error);
    res.status(500).json({ success: false, message: 'Failed to create farm' });
  }
});

/**
 * PUT /api/farms/:id
 * Update farm parameters
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid farm ID' });
      return;
    }

    const parseResult = farmUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid update data',
        errors: parseResult.error.errors,
      });
      return;
    }

    const updateData: any = { ...parseResult.data };
    if (updateData.soil_health_card === false && updateData.soil_type) {
      const defaults = getSoilDefaults(updateData.soil_type);
      updateData.soil_n = defaults.n;
      updateData.soil_p = defaults.p;
      updateData.soil_k = defaults.k;
      updateData.soil_ph = defaults.ph;
    }

    const updatedFarm = await Farm.findOneAndUpdate(
      { _id: id, user: req.user?._id },
      { $set: updateData },
      { new: true }
    );

    if (!updatedFarm) {
      res.status(404).json({ success: false, message: 'Farm not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Farm updated successfully',
      data: updatedFarm,
    });
  } catch (error: any) {
    console.error('[Farm Route] Error updating farm:', error);
    res.status(500).json({ success: false, message: 'Failed to update farm' });
  }
});

/**
 * DELETE /api/farms/:id
 * Delete farm and associated crops
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid farm ID' });
      return;
    }

    const farm = await Farm.findOneAndDelete({ _id: id, user: req.user?._id });
    if (!farm) {
      res.status(404).json({ success: false, message: 'Farm not found or unauthorized' });
      return;
    }

    // Delete associated crops
    await Crop.deleteMany({ farm: farm._id });

    res.status(200).json({
      success: true,
      message: 'Farm and associated crops deleted successfully',
    });
  } catch (error: any) {
    console.error('[Farm Route] Error deleting farm:', error);
    res.status(500).json({ success: false, message: 'Failed to delete farm' });
  }
});

// ==========================================
// 3. CROPS CRUD ENDPOINTS
// ==========================================

/**
 * POST /api/farms/:farmId/crops
 * Add a crop to a farm
 */
router.post('/:farmId/crops', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { farmId } = req.params;
    if (!Types.ObjectId.isValid(farmId)) {
      res.status(400).json({ success: false, message: 'Invalid farm ID' });
      return;
    }

    const farm = await Farm.findOne({ _id: farmId, user: req.user?._id });
    if (!farm) {
      res.status(404).json({ success: false, message: 'Farm not found or unauthorized' });
      return;
    }

    const parseResult = cropCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid crop data',
        errors: parseResult.error.errors,
      });
      return;
    }

    const sowingDate = new Date(parseResult.data.sowing_date);
    const lifecycle = calculateCropLifecycle({
      crop_type: parseResult.data.crop_type,
      sowing_date: sowingDate,
      expected_harvest_date: parseResult.data.expected_harvest_date,
    });

    const crop = await Crop.create({
      ...parseResult.data,
      expected_harvest_date: parseResult.data.expected_harvest_date || lifecycle.expected_harvest_date,
      current_growth_stage: lifecycle.current_stage.stage_name,
      farm: farm._id,
    });

    res.status(201).json({
      success: true,
      message: 'Crop added successfully',
      data: crop,
    });
  } catch (error: any) {
    console.error('[Farm Route] Error creating crop:', error);
    res.status(500).json({ success: false, message: 'Failed to create crop' });
  }
});

/**
 * PUT /api/farms/crops/:cropId
 * Update crop details or stage
 */
router.put('/crops/:cropId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { cropId } = req.params;
    if (!Types.ObjectId.isValid(cropId)) {
      res.status(400).json({ success: false, message: 'Invalid crop ID' });
      return;
    }

    const parseResult = cropUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid crop update data',
        errors: parseResult.error.errors,
      });
      return;
    }

    // Verify ownership via farm
    const crop = await Crop.findById(cropId);
    if (!crop) {
      res.status(404).json({ success: false, message: 'Crop not found' });
      return;
    }

    const farm = await Farm.findOne({ _id: crop.farm, user: req.user?._id });
    if (!farm) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const updatedCrop = await Crop.findByIdAndUpdate(
      cropId,
      { $set: parseResult.data },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Crop updated successfully',
      data: updatedCrop,
    });
  } catch (error: any) {
    console.error('[Farm Route] Error updating crop:', error);
    res.status(500).json({ success: false, message: 'Failed to update crop' });
  }
});

/**
 * DELETE /api/farms/crops/:cropId
 * Delete a crop
 */
router.delete('/crops/:cropId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { cropId } = req.params;
    if (!Types.ObjectId.isValid(cropId)) {
      res.status(400).json({ success: false, message: 'Invalid crop ID' });
      return;
    }

    const crop = await Crop.findById(cropId);
    if (!crop) {
      res.status(404).json({ success: false, message: 'Crop not found' });
      return;
    }

    const farm = await Farm.findOne({ _id: crop.farm, user: req.user?._id });
    if (!farm) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    await Crop.findByIdAndDelete(cropId);

    res.status(200).json({
      success: true,
      message: 'Crop deleted successfully',
    });
  } catch (error: any) {
    console.error('[Farm Route] Error deleting crop:', error);
    res.status(500).json({ success: false, message: 'Failed to delete crop' });
  }
});

// ==========================================
// 4. CROP HEALTH LOGGING ENDPOINTS
// ==========================================

/**
 * Handler for logging crop health check-in
 * Supports POST /api/farms/:farmId/crops/:cropId/health-logs
 * and POST /api/farms/crops/:cropId/health-logs
 */
const handleCreateCropHealthLog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { cropId, farmId } = req.params;
    if (!Types.ObjectId.isValid(cropId)) {
      res.status(400).json({ success: false, message: 'Invalid crop ID' });
      return;
    }

    const crop = await Crop.findById(cropId);
    if (!crop) {
      res.status(404).json({ success: false, message: 'Crop not found' });
      return;
    }

    const targetFarmId = farmId || crop.farm;
    const farm = await Farm.findOne({ _id: targetFarmId, user: req.user?._id });
    if (!farm) {
      res.status(403).json({ success: false, message: 'Unauthorized: Farm not owned by user' });
      return;
    }

    const parseResult = cropHealthLogCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid health log payload',
        errors: parseResult.error.errors,
      });
      return;
    }

    const result = await createHealthLog({
      crop_id: crop._id,
      farm_id: farm._id,
      health_status: parseResult.data.health_status,
      check_in_type: parseResult.data.check_in_type,
      ai_prediction: parseResult.data.ai_prediction,
      notes: parseResult.data.notes,
      photo_url: parseResult.data.photo_url,
      date: parseResult.data.date,
    });

    res.status(201).json({
      success: true,
      message: 'Crop health log recorded successfully',
      data: result.log,
      consecutive_concerning_count: result.consecutive_concerning_count,
      has_concerning_alert: result.has_concerning_alert,
    });
  } catch (error: any) {
    console.error('[Farm Route] Error creating health log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record crop health log',
      error: error.message,
    });
  }
};

/**
 * Handler for AI leaf disease diagnosis via image transfer learning
 * Supports POST /api/farms/:farmId/crops/:cropId/diagnose-health
 * and POST /api/farms/crops/:cropId/diagnose-health
 */
const handleDiagnoseCropHealth = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { cropId, farmId } = req.params;
    const { image, save_to_history, notes } = req.body;

    if (!image || typeof image !== 'string') {
      res.status(400).json({ success: false, message: 'Image base64 payload is required' });
      return;
    }

    if (!Types.ObjectId.isValid(cropId)) {
      res.status(400).json({ success: false, message: 'Invalid crop ID' });
      return;
    }

    const crop = await Crop.findById(cropId);
    if (!crop) {
      res.status(404).json({ success: false, message: 'Crop not found' });
      return;
    }

    const targetFarmId = farmId || crop.farm;
    const farm = await Farm.findOne({ _id: targetFarmId, user: req.user?._id });
    if (!farm) {
      res.status(403).json({ success: false, message: 'Unauthorized: Farm not owned by user' });
      return;
    }

    const prediction = await predictCropHealth(image, crop.crop_type);

    if (!prediction.available) {
      res.status(503).json({
        success: false,
        message: prediction.error || 'AI diagnostic service is temporarily unavailable',
      });
      return;
    }

    // Map AI diagnosis to a health status for history recording:
    // If low confidence -> "Okay" with warning
    // If is_healthy === true -> "Healthy"
    // If is_healthy === false -> "Concerning"
    let status: 'Healthy' | 'Okay' | 'Concerning' = 'Concerning';
    if (prediction.low_confidence) {
      status = 'Okay';
    } else if (prediction.is_healthy === true) {
      status = 'Healthy';
    }

    let savedLog = null;
    let consecutiveCount = 0;
    let hasAlert = false;

    if (save_to_history) {
      const result = await createHealthLog({
        crop_id: crop._id,
        farm_id: farm._id,
        health_status: status,
        check_in_type: 'ai_diagnosis',
        ai_prediction: prediction,
        notes: notes || `AI Photo Diagnosis: ${prediction.predicted_class} (${prediction.confidence} Confidence)`,
        photo_url: image.length < 150000 ? image : '', // store small preview if reasonable size
      });
      savedLog = result.log;
      consecutiveCount = result.consecutive_concerning_count;
      hasAlert = result.has_concerning_alert;
    }

    res.status(200).json({
      success: true,
      prediction,
      saved_log: savedLog,
      consecutive_concerning_count: consecutiveCount,
      has_concerning_alert: hasAlert,
    });
  } catch (error: any) {
    console.error('[Farm Route] AI diagnose error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI health diagnosis',
    });
  }
};

/**
 * Handler for fetching crop health history
 * Supports GET /api/farms/:farmId/crops/:cropId/health-logs
 * and GET /api/farms/crops/:cropId/health-logs
 */
const handleGetCropHealthLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { cropId } = req.params;
    if (!Types.ObjectId.isValid(cropId)) {
      res.status(400).json({ success: false, message: 'Invalid crop ID' });
      return;
    }

    const crop = await Crop.findById(cropId);
    if (!crop) {
      res.status(404).json({ success: false, message: 'Crop not found' });
      return;
    }

    const farm = await Farm.findOne({ _id: crop.farm, user: req.user?._id });
    if (!farm) {
      res.status(403).json({ success: false, message: 'Unauthorized: Farm not owned by user' });
      return;
    }

    const result = await getHealthLogsForCrop(crop._id);

    res.status(200).json({
      success: true,
      data: result.logs,
      count: result.logs.length,
      consecutive_concerning_count: result.consecutive_concerning_count,
      has_concerning_alert: result.has_concerning_alert,
    });
  } catch (error: any) {
    console.error('[Farm Route] Error fetching crop health logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve crop health logs',
      error: error.message,
    });
  }
};

router.post('/:farmId/crops/:cropId/health-logs', handleCreateCropHealthLog);
router.get('/:farmId/crops/:cropId/health-logs', handleGetCropHealthLogs);
router.post('/crops/:cropId/health-logs', handleCreateCropHealthLog);
router.get('/crops/:cropId/health-logs', handleGetCropHealthLogs);

// AI Crop Health Diagnosis endpoints
router.post('/:farmId/crops/:cropId/diagnose-health', handleDiagnoseCropHealth);
router.post('/crops/:cropId/diagnose-health', handleDiagnoseCropHealth);

// ==========================================
// 5. CROP LIFECYCLE & SOWING ADVISORY ENDPOINTS (Module 6)
// ==========================================

/**
 * GET /api/crops/:cropId/lifecycle or /api/farms/:farmId/crops/:cropId/lifecycle
 * Returns current growth stage, days until next milestone, expected harvest date,
 * milestone progression, and sowing advisory.
 */
export const handleGetCropLifecycle = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { cropId } = req.params;
    if (!Types.ObjectId.isValid(cropId)) {
      res.status(400).json({ success: false, message: 'Invalid crop ID' });
      return;
    }

    const crop = await Crop.findById(cropId);
    if (!crop) {
      res.status(404).json({ success: false, message: 'Crop not found' });
      return;
    }

    const farm = await Farm.findOne({ _id: crop.farm, user: req.user?._id });
    if (!farm) {
      res.status(403).json({ success: false, message: 'Unauthorized: Farm not owned by user' });
      return;
    }

    // Optional simulated/query date for testing
    const refDate = req.query.date ? new Date(String(req.query.date)) : new Date();
    const lifecycle = calculateCropLifecycle(crop, refDate);

    // Sync latest growth stage name to crop document if updated
    if (crop.current_growth_stage !== lifecycle.current_stage.stage_name) {
      crop.current_growth_stage = lifecycle.current_stage.stage_name;
      await crop.save();
    }

    res.status(200).json({
      success: true,
      data: {
        ...lifecycle,
        farm_name: farm.name,
      },
    });
  } catch (error: any) {
    console.error('[Farm Route] Error fetching crop lifecycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve crop lifecycle details',
      error: error.message,
    });
  }
};

router.get('/:farmId/crops/:cropId/lifecycle', handleGetCropLifecycle);
router.get('/crops/:cropId/lifecycle', handleGetCropLifecycle);

export default router;

