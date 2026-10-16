import { Types } from 'mongoose';
import { OutbreakReport, IOutbreakReport } from '../models/OutbreakReport.js';
import { Farm } from '../models/Farm.js';
import { Crop } from '../models/Crop.js';

export interface NearbyOutbreakItem {
  id: string;
  cropType: string;
  concern: string;
  distanceKm: number;
  daysAgo: number;
  isDemo: boolean;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  guidance: string;
}

export interface UserCommunityAlert {
  farmId: string;
  farmName: string;
  cropType: string;
  nearestDistanceKm: number;
  concern: string;
  daysAgo: number;
  isDemo: boolean;
  outbreakCount: number;
  guidance: string;
}

/**
 * Creates a rough offset location (~450-550m) to preserve farmer privacy.
 * Exact coordinates or personal identities are NEVER stored or returned.
 */
export function createRoughOffsetLocation(longitude: number, latitude: number, offsetMeters = 500): [number, number] {
  const angle = Math.random() * 2 * Math.PI;
  // Vary offset slightly between 450m and 550m
  const distance = offsetMeters * (0.9 + Math.random() * 0.2);
  const earthRadius = 6378137; // Earth radius in meters

  const dLat = (distance * Math.cos(angle)) / earthRadius;
  const dLng = (distance * Math.sin(angle)) / (earthRadius * Math.cos((latitude * Math.PI) / 180));

  const roughLat = latitude + (dLat * 180) / Math.PI;
  const roughLng = longitude + (dLng * 180) / Math.PI;

  return [Number(roughLng.toFixed(6)), Number(roughLat.toFixed(6))];
}

/**
 * Generates agronomic safe guidance strictly without chemical pesticide brand names or dosages.
 */
export function getSafeAgronomicGuidance(concern: string, cropType: string): string {
  const c = concern.toLowerCase();
  if (c.includes('blight') || c.includes('mildew') || c.includes('rust') || c.includes('spot') || c.includes('fungal')) {
    return 'Fungal pathogen suspected in nearby fields. Remove infected leaves, improve row aeration, avoid overhead sprinkler watering, and consult your local agriculture extension officer.';
  }
  if (c.includes('wilt') || c.includes('rot') || c.includes('bacterial')) {
    return 'Bacterial or root stress detected nearby. Inspect plant stems, sanitize cutting implements, avoid water stagnation, and consult your local agriculture extension officer.';
  }
  if (c.includes('curl') || c.includes('mosaic') || c.includes('virus')) {
    return 'Viral disease reported nearby. Monitor for sucking pests like whiteflies and aphids, rogue out severely diseased plants, and consult your local agriculture extension officer.';
  }
  return `Crop health concern reported for ${cropType} in your locality. Inspect your field rows promptly and consult your local agriculture extension officer.`;
}

/**
 * Record an outbreak report automatically when a crop health check is Concerning or AI finds disease.
 */
export async function recordOutbreakReportIfConcerning(params: {
  farmId: Types.ObjectId | string;
  cropId?: Types.ObjectId | string;
  cropType?: string;
  healthStatus?: string;
  concernName?: string;
  isAiDiagnosis?: boolean;
}): Promise<IOutbreakReport | null> {
  try {
    const isConcerning = 
      params.healthStatus === 'Concerning' || 
      (params.concernName && params.concernName.toLowerCase() !== 'healthy');
    
    if (!isConcerning) return null;

    const farm = await Farm.findById(params.farmId);
    if (!farm || farm.latitude === undefined || farm.longitude === undefined) return null;

    let cropType = params.cropType;
    if (!cropType && params.cropId) {
      const crop = await Crop.findById(params.cropId);
      if (crop) cropType = crop.crop_type;
    }
    if (!cropType) cropType = 'crop';

    // Rough location offset (~500m) to protect farmer privacy
    const [roughLng, roughLat] = createRoughOffsetLocation(farm.longitude, farm.latitude, 500);

    const report = await OutbreakReport.create({
      cropType: cropType.toLowerCase().trim(),
      concern: params.concernName || 'general concern',
      location: {
        type: 'Point',
        coordinates: [roughLng, roughLat],
      },
      reportedAt: new Date(),
      farmId: farm._id,
      isDemo: false,
    });

    return report;
  } catch (error) {
    console.error('[OutbreakService] Failed to record outbreak:', error);
    return null;
  }
}

/**
 * Queries MongoDB using $geoNear to return reports from the last 14 days
 * for the same crop, excluding the farmer's own farm.
 * Strictly returns distance in km, concern, days ago, safe guidance, rough location, and isDemo.
 */
export async function getNearbyOutbreaks(
  farmId: string, 
  radiusKm = 10, 
  cropTypeOverride?: string
): Promise<NearbyOutbreakItem[]> {
  const farm = await Farm.findById(farmId);
  if (!farm) throw new Error('Farm not found');

  let cropType = cropTypeOverride;
  if (!cropType) {
    const crop = await Crop.findOne({ farm: farm._id });
    if (crop) cropType = crop.crop_type;
  }

  // 14 days cutoff
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const maxDistanceMeters = Number(radiusKm) * 1000;

  // Farm coordinates: GeoJSON expects [lng, lat]
  const farmLng = farm.location?.coordinates?.[0] ?? farm.longitude;
  const farmLat = farm.location?.coordinates?.[1] ?? farm.latitude;

  const queryFilter: any = {
    farmId: { $ne: farm._id },
    reportedAt: { $gte: fourteenDaysAgo },
  };

  if (cropType) {
    queryFilter.cropType = { $regex: new RegExp(`^${cropType.trim()}$`, 'i') };
  }

  const results = await OutbreakReport.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [farmLng, farmLat],
        },
        distanceField: 'distanceMeters',
        maxDistance: maxDistanceMeters,
        query: queryFilter,
        spherical: true,
      },
    },
    {
      $sort: { distanceMeters: 1 },
    },
  ]);

  return results.map((doc) => {
    const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(doc.reportedAt).getTime()) / (1000 * 60 * 60 * 24)));
    const distanceKm = Number((doc.distanceMeters / 1000).toFixed(1));
    return {
      id: doc._id.toString(),
      cropType: doc.cropType,
      concern: doc.concern,
      distanceKm,
      daysAgo,
      isDemo: Boolean(doc.isDemo),
      location: doc.location,
      guidance: getSafeAgronomicGuidance(doc.concern, doc.cropType),
    };
  });
}

/**
 * Returns community alerts for all farms owned by the user where a nearby outbreak matches the farm's crop.
 * Only farms growing a matching crop will trigger an alert banner.
 */
export async function getUserCommunityAlerts(userId: Types.ObjectId | string): Promise<UserCommunityAlert[]> {
  const userFarms = await Farm.find({ user: new Types.ObjectId(userId) });
  const alerts: UserCommunityAlert[] = [];

  for (const farm of userFarms) {
    const crop = await Crop.findOne({ farm: farm._id });
    if (!crop) continue; // No crop registered for this plot, no banner

    const nearby = await getNearbyOutbreaks(farm._id.toString(), 15, crop.crop_type);
    if (nearby.length > 0) {
      const nearest = nearby[0];
      alerts.push({
        farmId: farm._id.toString(),
        farmName: farm.name,
        cropType: crop.crop_type,
        nearestDistanceKm: nearest.distanceKm,
        concern: nearest.concern,
        daysAgo: nearest.daysAgo,
        isDemo: nearest.isDemo,
        outbreakCount: nearby.length,
        guidance: nearest.guidance,
      });
    }
  }

  return alerts;
}

/**
 * Migrates existing farms that do not have a GeoJSON Point location field.
 * Also builds the 2dsphere indexes.
 */
export async function migrateExistingFarmLocations(): Promise<{ migratedCount: number; indexBuilt: boolean }> {
  try {
    const farmsWithoutLocation = await Farm.find({
      $or: [
        { location: { $exists: false } },
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates.0': { $exists: false } },
      ],
    });

    let count = 0;
    for (const farm of farmsWithoutLocation) {
      if (farm.latitude !== undefined && farm.longitude !== undefined) {
        farm.location = {
          type: 'Point',
          coordinates: [farm.longitude, farm.latitude],
        };
        await farm.save();
        count++;
      }
    }

    // Ensure 2dsphere indexes
    await Farm.collection.createIndex({ location: '2dsphere' });
    await OutbreakReport.collection.createIndex({ location: '2dsphere' });

    return { migratedCount: count, indexBuilt: true };
  } catch (error) {
    console.error('[OutbreakService] Error during migration:', error);
    return { migratedCount: 0, indexBuilt: false };
  }
}

/**
 * Seeds 6 honest demo outbreak reports near the farmer's farm (marked isDemo: true).
 */
export async function seedDemoOutbreaksForFarmer(farmId: string): Promise<IOutbreakReport[]> {
  const farm = await Farm.findById(farmId);
  if (!farm) throw new Error('Farm not found');

  const crop = await Crop.findOne({ farm: farm._id });
  const farmerCrop = crop ? crop.crop_type.toLowerCase() : 'tomato';

  // Clear previous demo outbreaks for this vicinity to avoid duplicates
  await OutbreakReport.deleteMany({ isDemo: true, farmId: { $ne: farm._id } });

  // Use a pseudo external farmId so it is excluded from "farmer's own farm"
  const dummyOtherFarmId = new Types.ObjectId();

  const demoScenarios = [
    {
      cropType: farmerCrop,
      concern: `${farmerCrop === 'tomato' ? 'Tomato Early Blight' : farmerCrop + ' Fungal Leaf Spot'}`,
      distanceKm: 3.8,
      daysAgo: 2,
      bearingDeg: 35,
    },
    {
      cropType: farmerCrop,
      concern: 'general concern',
      distanceKm: 5.4,
      daysAgo: 4,
      bearingDeg: 120,
    },
    {
      cropType: farmerCrop,
      concern: `${farmerCrop === 'tomato' ? 'Tomato Leaf Curl Virus' : farmerCrop + ' Rust Pathogen'}`,
      distanceKm: 7.2,
      daysAgo: 1,
      bearingDeg: 215,
    },
    {
      cropType: farmerCrop === 'wheat' ? 'tomato' : 'wheat',
      concern: 'Wheat Yellow Rust',
      distanceKm: 4.5,
      daysAgo: 3,
      bearingDeg: 290,
    },
    {
      cropType: farmerCrop === 'rice' ? 'cotton' : 'rice',
      concern: 'Rice Blast',
      distanceKm: 6.8,
      daysAgo: 5,
      bearingDeg: 75,
    },
    {
      cropType: farmerCrop === 'cotton' ? 'maize' : 'cotton',
      concern: 'Bacterial Blight',
      distanceKm: 8.5,
      daysAgo: 7,
      bearingDeg: 160,
    },
  ];

  const earthRadius = 6378.137; // in km
  const farmLat = farm.latitude;
  const farmLng = farm.longitude;

  const createdReports: IOutbreakReport[] = [];

  for (const demo of demoScenarios) {
    const bearingRad = (demo.bearingDeg * Math.PI) / 180;
    const dLat = (demo.distanceKm * Math.cos(bearingRad)) / earthRadius;
    const dLng = (demo.distanceKm * Math.sin(bearingRad)) / (earthRadius * Math.cos((farmLat * Math.PI) / 180));

    const reportLat = Number((farmLat + (dLat * 180) / Math.PI).toFixed(6));
    const reportLng = Number((farmLng + (dLng * 180) / Math.PI).toFixed(6));

    const reportedDate = new Date(Date.now() - demo.daysAgo * 24 * 60 * 60 * 1000);

    const report = await OutbreakReport.create({
      cropType: demo.cropType,
      concern: demo.concern,
      location: {
        type: 'Point',
        coordinates: [reportLng, reportLat],
      },
      reportedAt: reportedDate,
      farmId: dummyOtherFarmId,
      isDemo: true,
    });

    createdReports.push(report);
  }

  return createdReports;
}
