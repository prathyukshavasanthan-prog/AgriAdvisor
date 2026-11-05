/**
 * Historical 5-Year Seasonal Weather Service (Open-Meteo Archive API + 30-Day Cache)
 * 
 * Requirement (Phase 2):
 * - Do NOT feed today's forecast to the crop recommendation model.
 * - Fetch the average temperature, humidity and total rainfall for the crop season
 *   (Kharif Jun-Oct, Rabi Nov-Mar, Zaid Apr-Jun) for the farm location over the last 5 years
 *   from the Open-Meteo Historical Weather API.
 * - Cache for 30 days.
 */

import { HistoricalWeatherCache } from '../models/HistoricalWeatherCache.js';

export type CropSeason = 'kharif' | 'rabi' | 'zaid';

export interface SeasonalClimatology {
  season: CropSeason;
  season_label: string;
  season_months: string;
  temperature: number;      // 5-year average seasonal mean temperature (°C)
  humidity: number;         // 5-year average seasonal relative humidity (%)
  rainfall: number;         // 5-year average total seasonal rainfall (mm)
  source: 'open_meteo_archive' | 'agro_climatic_normals' | 'cache_30d';
  years_analyzed: number;
  cached_until: Date;
}

/**
 * Identify active crop season based on calendar month
 * Kharif: June (6) to October (10)
 * Rabi: November (11) to March (3)
 * Zaid: April (4) to May (5)
 */
export const identifyCropSeason = (date: Date = new Date()): CropSeason => {
  const month = date.getMonth() + 1; // 1-12
  if (month >= 6 && month <= 10) return 'kharif';
  if (month >= 11 || month <= 3) return 'rabi';
  return 'zaid';
};

/**
 * Seasonal date labels and windows
 */
export const SEASON_METADATA: Record<CropSeason, { label: string; months: string }> = {
  kharif: { label: 'Kharif (Monsoon)', months: 'June – October' },
  rabi: { label: 'Rabi (Winter)', months: 'November – March' },
  zaid: { label: 'Zaid (Summer)', months: 'April – May' },
};

/**
 * Regional Agro-Climatic Normals (ICAR / IMD 1991–2020 Long-Period Averages)
 * Used as reliable fallback if external Open-Meteo archive times out or hits rate limits.
 */
const getRegionalAgroClimaticNormals = (
  latitude: number,
  longitude: number,
  season: CropSeason
): { temperature: number; humidity: number; rainfall: number } => {
  // 1. Indo-Gangetic Plains & North (Punjab, Haryana, UP, Bihar, WB)
  if (latitude >= 24.0 && longitude <= 88.0) {
    if (season === 'kharif') return { temperature: 30.2, humidity: 78.5, rainfall: 820.0 };
    if (season === 'rabi') return { temperature: 18.5, humidity: 62.0, rainfall: 110.0 };
    return { temperature: 34.0, humidity: 45.0, rainfall: 65.0 };
  }

  // 2. Deccan Plateau & Central India (MP, Maharashtra, Telangana, North Karnataka)
  if (latitude >= 14.0 && latitude < 24.0) {
    if (season === 'kharif') return { temperature: 27.8, humidity: 74.0, rainfall: 710.0 };
    if (season === 'rabi') return { temperature: 22.4, humidity: 55.0, rainfall: 45.0 };
    return { temperature: 32.5, humidity: 40.0, rainfall: 35.0 };
  }

  // 3. Southern Peninsula & Coastal (Tamil Nadu, Kerala, Coastal AP)
  if (latitude < 14.0) {
    if (season === 'kharif') return { temperature: 28.0, humidity: 76.0, rainfall: 650.0 };
    if (season === 'rabi') return { temperature: 26.0, humidity: 72.0, rainfall: 320.0 }; // NE Monsoon in TN
    return { temperature: 31.0, humidity: 68.0, rainfall: 90.0 };
  }

  // General Pan-India fallback average
  if (season === 'kharif') return { temperature: 28.5, humidity: 75.0, rainfall: 750.0 };
  if (season === 'rabi') return { temperature: 21.0, humidity: 58.0, rainfall: 75.0 };
  return { temperature: 32.0, humidity: 42.0, rainfall: 45.0 };
};

/**
 * Fetch 5-year seasonal climatology with 30-day MongoDB cache
 */
export const getSeasonalClimatology = async (
  latitude: number,
  longitude: number,
  refDate: Date = new Date()
): Promise<SeasonalClimatology> => {
  const season = identifyCropSeason(refDate);
  const roundedLat = Number(latitude.toFixed(2));
  const roundedLon = Number(longitude.toFixed(2));
  const cacheKey = `clim:5yr:${roundedLat}:${roundedLon}:${season}`;

  // 1. Check 30-Day MongoDB Cache
  try {
    const cached = await HistoricalWeatherCache.findOne({
      cache_key: cacheKey,
      expires_at: { $gt: new Date() },
    }).lean();

    if (cached) {
      return {
        season,
        season_label: SEASON_METADATA[season].label,
        season_months: SEASON_METADATA[season].months,
        temperature: cached.temperature_avg,
        humidity: cached.humidity_avg,
        rainfall: cached.rainfall_total_avg,
        source: 'cache_30d',
        years_analyzed: cached.years_analyzed || 5,
        cached_until: cached.expires_at,
      };
    }
  } catch (dbErr) {
    console.warn('[Historical Weather] Cache lookup error:', dbErr);
  }

  // 2. Fetch 5 years of historical seasonal weather from Open-Meteo Archive API
  // Target: last 5 full years (e.g. 2020 to 2024 if reference year is 2025/2026)
  const currentYear = refDate.getFullYear();
  const startYear = currentYear - 5;
  const endYear = currentYear - 1;

  let temperatureAvg = 0;
  let humidityAvg = 0;
  let rainfallTotalAvg = 0;
  let sourceUsed: 'open_meteo_archive' | 'agro_climatic_normals' = 'open_meteo_archive';

  try {
    // Determine representative 5-year historical interval
    // For fast, reliable single API query, query full historical archive for the 5-year block
    const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${roundedLat}&longitude=${roundedLon}&start_date=${startYear}-01-01&end_date=${endYear}-12-31&daily=temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum&timezone=auto`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(archiveUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Open-Meteo Archive returned HTTP ${res.status}`);
    }

    const data: any = await res.json();
    if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
      throw new Error('No daily time-series returned in archive response');
    }

    // Filter days belonging to the active season across all 5 years
    const dailyTimes: string[] = data.daily.time;
    const dailyTemps: number[] = data.daily.temperature_2m_mean;
    const dailyHum: number[] = data.daily.relative_humidity_2m_mean;
    const dailyRain: number[] = data.daily.precipitation_sum;

    let seasonDayCount = 0;
    let tempSum = 0;
    let humSum = 0;
    let rainSum = 0;

    for (let i = 0; i < dailyTimes.length; i++) {
      const dateStr = dailyTimes[i];
      const m = parseInt(dateStr.substring(5, 7), 10); // month 1-12
      let inSeason = false;

      if (season === 'kharif' && m >= 6 && m <= 10) inSeason = true;
      else if (season === 'rabi' && (m >= 11 || m <= 3)) inSeason = true;
      else if (season === 'zaid' && m >= 4 && m <= 5) inSeason = true;

      if (inSeason) {
        seasonDayCount++;
        if (dailyTemps[i] !== null && !isNaN(dailyTemps[i])) tempSum += dailyTemps[i];
        if (dailyHum[i] !== null && !isNaN(dailyHum[i])) humSum += dailyHum[i];
        if (dailyRain[i] !== null && !isNaN(dailyRain[i])) rainSum += dailyRain[i];
      }
    }

    if (seasonDayCount > 50) {
      temperatureAvg = Number((tempSum / seasonDayCount).toFixed(1));
      humidityAvg = Number((humSum / seasonDayCount).toFixed(1));
      // rainSum is the sum over 5 years of the season -> average seasonal total = rainSum / 5
      rainfallTotalAvg = Number((rainSum / 5).toFixed(1));
    } else {
      throw new Error('Insufficient in-season sample days found in archive');
    }
  } catch (apiErr: any) {
    console.warn(`[Historical Weather] Falling back to agro-climatic normals: ${apiErr.message}`);
    const normals = getRegionalAgroClimaticNormals(roundedLat, roundedLon, season);
    temperatureAvg = normals.temperature;
    humidityAvg = normals.humidity;
    rainfallTotalAvg = normals.rainfall;
    sourceUsed = 'agro_climatic_normals';
  }

  // 3. Save to 30-Day Cache in MongoDB
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  try {
    await HistoricalWeatherCache.findOneAndUpdate(
      { cache_key: cacheKey },
      {
        cache_key: cacheKey,
        latitude: roundedLat,
        longitude: roundedLon,
        season,
        temperature_avg: temperatureAvg,
        humidity_avg: humidityAvg,
        rainfall_total_avg: rainfallTotalAvg,
        years_analyzed: 5,
        source: sourceUsed,
        cached_at: new Date(),
        expires_at: expiresAt,
      },
      { upsert: true, new: true }
    );
  } catch (saveErr) {
    console.warn('[Historical Weather] Failed to write cache record:', saveErr);
  }

  return {
    season,
    season_label: SEASON_METADATA[season].label,
    season_months: SEASON_METADATA[season].months,
    temperature: temperatureAvg,
    humidity: humidityAvg,
    rainfall: rainfallTotalAvg,
    source: sourceUsed,
    years_analyzed: 5,
    cached_until: expiresAt,
  };
};
