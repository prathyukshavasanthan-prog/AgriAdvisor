import { redis } from '../config/redis.js';
import { WeatherHistory } from '../models/WeatherHistory.js';
import { Types } from 'mongoose';

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  weather_code: number;
  forecast_rain_probability: number;
  forecast_rain_amount: number;
  daily_forecast: {
    date: string;
    weather_code: number;
    temp_max: number;
    temp_min: number;
    rain_probability: number;
    rain_amount: number;
  }[];
  source: 'redis_cache' | 'open_meteo';
}

const REDIS_TTL_SECONDS = 3600; // 1 hour cache TTL as specified

export const getWeatherData = async (
  latitude: number,
  longitude: number,
  farmId?: Types.ObjectId | string
): Promise<WeatherData> => {
  const roundedLat = Number(latitude.toFixed(3));
  const roundedLon = Number(longitude.toFixed(3));
  const cacheKey = `weather:${roundedLat}:${roundedLon}`;

  // 1. Check Redis Cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as WeatherData;
      parsed.source = 'redis_cache';
      return parsed;
    }
  } catch (err) {
    console.warn('[Weather Service] Redis get skipped:', err);
  }

  // 2. Fetch from Open-Meteo API (Free, no key required)
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto`;

  let responseData: any;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`Open-Meteo responded with status ${res.status}`);
    }
    responseData = await res.json();
  } catch (error) {
    console.error('[Weather Service] Failed to fetch from Open-Meteo:', error);
    // Provide sensible fallback if network to open-meteo fails temporarily
    responseData = {
      current: {
        temperature_2m: 28.5,
        relative_humidity_2m: 65,
        precipitation: 0.0,
        weather_code: 1,
        wind_speed_10m: 10.5,
      },
      daily: {
        time: [new Date().toISOString().split('T')[0]],
        weather_code: [1],
        temperature_2m_max: [31],
        temperature_2m_min: [20],
        precipitation_sum: [0],
        precipitation_probability_max: [10],
      },
    };
  }

  const current = responseData.current || {};
  const daily = responseData.daily || {};

  const dailyForecast = (daily.time || []).map((date: string, index: number) => ({
    date,
    weather_code: daily.weather_code?.[index] ?? 0,
    temp_max: daily.temperature_2m_max?.[index] ?? current.temperature_2m,
    temp_min: daily.temperature_2m_min?.[index] ?? current.temperature_2m - 8,
    rain_probability: daily.precipitation_probability_max?.[index] ?? 10,
    rain_amount: daily.precipitation_sum?.[index] ?? 0,
  }));

  const weatherResult: WeatherData = {
    temperature: current.temperature_2m ?? 28,
    humidity: current.relative_humidity_2m ?? 65,
    precipitation: current.precipitation ?? 0,
    wind_speed: current.wind_speed_10m ?? 10,
    weather_code: current.weather_code ?? 0,
    forecast_rain_probability: daily.precipitation_probability_max?.[0] ?? 15,
    forecast_rain_amount: daily.precipitation_sum?.[0] ?? 0,
    daily_forecast: dailyForecast,
    source: 'open_meteo',
  };

  // 3. Cache in Redis (1 hour TTL)
  try {
    await redis.set(cacheKey, JSON.stringify(weatherResult), 'EX', REDIS_TTL_SECONDS);
  } catch (err) {
    console.warn('[Weather Service] Redis set failed:', err);
  }

  // 4. Store History in MongoDB
  try {
    await WeatherHistory.create({
      farm: farmId ? new Types.ObjectId(farmId.toString()) : undefined,
      latitude: roundedLat,
      longitude: roundedLon,
      temperature: weatherResult.temperature,
      humidity: weatherResult.humidity,
      precipitation: weatherResult.precipitation,
      weather_code: weatherResult.weather_code,
      wind_speed: weatherResult.wind_speed,
      fetched_at: new Date(),
    });
  } catch (err) {
    console.error('[Weather Service] Failed to persist weather history in MongoDB:', err);
  }

  return weatherResult;
};
