import { Types } from 'mongoose';
import { IrrigationLog, IIrrigationLog } from '../models/IrrigationLog.js';
import { Farm, IFarm } from '../models/Farm.js';
import { Crop, ICrop } from '../models/Crop.js';
import { getSoilDefaults } from './soilDefaults.js';

// FAO-56 Table 19: Available Water Holding Capacity (mm/m)
export const SOIL_AWHC: Record<string, number> = {
  alluvial: 155.0,
  black: 185.0,
  red: 130.0,
  laterite: 115.0,
  sandy: 80.0,
  sandy_loam: 125.0,
  loamy: 160.0,
  silty: 190.0,
  clay_loam: 180.0,
  clay: 175.0,
  saline_alkaline: 140.0,
  peaty_marshy: 210.0,
  desert_arid: 75.0,
  hill_forest: 150.0,
};

// FAO-56 Table 12: Crop coefficients Kc, Rooting Depth Zr (m), and Depletion Fraction p
export const CROP_FAO: Record<string, { kc: number; zr: number; p: number }> = {
  rice: { kc: 1.15, zr: 0.6, p: 0.20 },
  wheat: { kc: 1.05, zr: 1.0, p: 0.55 },
  cotton: { kc: 1.10, zr: 1.2, p: 0.65 },
  maize: { kc: 1.10, zr: 1.0, p: 0.50 },
  chickpea: { kc: 0.90, zr: 0.8, p: 0.50 },
  sugarcane: { kc: 1.20, zr: 1.3, p: 0.65 },
  tomato: { kc: 1.05, zr: 0.7, p: 0.40 },
  banana: { kc: 1.10, zr: 0.8, p: 0.35 },
  grapes: { kc: 0.85, zr: 1.2, p: 0.45 },
  apple: { kc: 0.90, zr: 1.2, p: 0.50 },
  watermelon: { kc: 1.00, zr: 0.8, p: 0.40 },
  muskmelon: { kc: 1.00, zr: 0.8, p: 0.40 },
  lentil: { kc: 0.95, zr: 0.8, p: 0.50 },
  blackgram: { kc: 0.95, zr: 0.7, p: 0.50 },
  mungbean: { kc: 0.95, zr: 0.7, p: 0.50 },
  pigeonpeas: { kc: 1.00, zr: 1.0, p: 0.55 },
};

// Method application efficiencies (FAO-56 Irrigation Engineering)
export const METHOD_EFFICIENCY: Record<string, number> = {
  drip: 0.90,
  sprinkler: 0.80,
  furrow: 0.70,
  flood: 0.60,
  none: 1.00,
};

export interface SoilWaterDepletionEstimate {
  soil_water_depletion_pct: number;
  awhc: number;
  taw_mm: number;
  raw_mm: number;
  crop_kc: number;
  root_depth_m: number;
  irrigation_efficiency: number;
  days_since_rain: number;
  days_since_last_irrigation: number;
  recent_irrigation_count: number;
  last_irrigation_date: Date | null;
  et0_daily_avg: number;
}

/**
 * Estimates root-zone soil water depletion over the past 14 days
 * based on FAO-56 daily water balance equations, weather observations, and farmer's IrrigationLogs.
 */
export async function calculateSoilWaterDepletion(
  farm: IFarm | any,
  crop: ICrop | any | null,
  weatherData: any
): Promise<SoilWaterDepletionEstimate> {
  const soilType = (farm.soil_type || 'loamy').toLowerCase().trim();
  const awhc = farm.awhc || SOIL_AWHC[soilType] || 160.0;

  const cropType = (crop?.crop_type || 'wheat').toLowerCase().trim();
  const cropInfo = CROP_FAO[cropType] || { kc: 1.0, zr: 0.8, p: 0.50 };

  const method = (farm.irrigation_method || 'drip').toLowerCase().trim();
  const efficiency = METHOD_EFFICIENCY[method] || 0.90;

  // Total Available Water in root zone (mm) = AWHC (mm/m) * Zr (m)
  const TAW = awhc * cropInfo.zr;
  const RAW = cropInfo.p * TAW;

  // Retrieve farmer's irrigation logs within the past 14 days
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const logs = await IrrigationLog.find({
    farm_id: farm._id,
    date: { $gte: fourteenDaysAgo },
  }).sort({ date: -1 }).lean();

  const latestLog = logs.length > 0 ? logs[0] : null;
  let daysSinceLastIrrigation = 14;

  if (latestLog && latestLog.date) {
    const diffMs = Date.now() - new Date(latestLog.date).getTime();
    daysSinceLastIrrigation = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
  } else if (crop?.sowing_date) {
    // If no recent log, estimate from crop sowing lifecycle
    const sowingAgeDays = Math.max(0, Math.floor((Date.now() - new Date(crop.sowing_date).getTime()) / 86400000));
    daysSinceLastIrrigation = Math.min(14, (sowingAgeDays % 7) || 4);
  } else {
    daysSinceLastIrrigation = 5;
  }

  // Daily weather parameters
  const temp = weatherData?.temperature ?? 28.0;
  const precipitation = weatherData?.precipitation ?? 0.0;
  const forecastRainAmount = weatherData?.forecast_rain_amount ?? 0.0;
  const daysSinceRain = precipitation > 1.0 ? 0 : 5;

  // Estimated daily reference evapotranspiration ET0 (Hargreaves/Penman approximation)
  const et0DailyAvg = Math.max(2.0, Math.min(8.0, 0.0023 * (temp + 17.8) * Math.sqrt(Math.max(1.0, 35 - temp)) * 1.5));
  const dailyETc = cropInfo.kc * et0DailyAvg;

  // Step through 14-day soil moisture depletion simulation
  let Dr = 0.20 * TAW; // Baseline starting depletion

  // Map irrigation logs by day offset (0 = today, 13 = 13 days ago)
  const irrigByDay: Record<number, number> = {};
  logs.forEach((log) => {
    const dayOffset = Math.floor((Date.now() - new Date(log.date).getTime()) / (24 * 60 * 60 * 1000));
    if (dayOffset >= 0 && dayOffset < 14) {
      irrigByDay[dayOffset] = (irrigByDay[dayOffset] || 0) + (log.amount_mm || 25.0);
    }
  });

  for (let day = 13; day >= 0; day--) {
    // Add daily crop evapotranspiration
    Dr += dailyETc;

    // Check if rain occurred recently (simplified decay across the 14 days)
    if (day === 0 && precipitation > 0) {
      Dr -= Math.min(precipitation, Dr + 2.0);
    }

    // Apply farmer's irrigation event on this day if logged
    if (irrigByDay[day]) {
      const effectiveWater = irrigByDay[day] * efficiency;
      Dr -= effectiveWater;
    }

    // Keep depletion bounded between 0 (field capacity) and TAW (wilting point)
    Dr = Math.max(0.0, Math.min(TAW, Dr));
  }

  const depletionPct = Math.max(0.0, Math.min(100.0, (Dr / TAW) * 100.0));

  return {
    soil_water_depletion_pct: Math.round(depletionPct * 10) / 10,
    awhc,
    taw_mm: Math.round(TAW * 10) / 10,
    raw_mm: Math.round(RAW * 10) / 10,
    crop_kc: cropInfo.kc,
    root_depth_m: cropInfo.zr,
    irrigation_efficiency: efficiency,
    days_since_rain: daysSinceRain,
    days_since_last_irrigation: daysSinceLastIrrigation,
    recent_irrigation_count: logs.length,
    last_irrigation_date: latestLog ? new Date(latestLog.date) : null,
    et0_daily_avg: Math.round(et0DailyAvg * 10) / 10,
  };
}

/**
 * Record a one-tap "I watered today" action for a farm
 */
export async function logWateredToday(
  farmId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  method?: 'flood' | 'furrow' | 'drip' | 'sprinkler' | 'none',
  amount_mm: number = 25.0,
  notes: string = 'Cultivator logged watering event via one-tap action.'
): Promise<IIrrigationLog> {
  const farm = await Farm.findById(farmId);
  const selectedMethod = method || (farm?.irrigation_method as any) || 'drip';

  const newLog = await IrrigationLog.create({
    farm_id: new Types.ObjectId(farmId.toString()),
    user_id: new Types.ObjectId(userId.toString()),
    date: new Date(),
    method: selectedMethod,
    amount_mm: amount_mm || 25.0,
    notes,
    logged_at: new Date(),
  });

  return newLog;
}
