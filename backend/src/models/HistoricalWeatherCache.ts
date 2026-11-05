import mongoose, { Document, Schema } from 'mongoose';

export interface IHistoricalWeatherCache extends Document {
  cache_key: string;
  latitude: number;
  longitude: number;
  season: 'kharif' | 'rabi' | 'zaid';
  temperature_avg: number;
  humidity_avg: number;
  rainfall_total_avg: number;
  years_analyzed: number;
  source: 'open_meteo_archive' | 'agro_climatic_normals';
  cached_at: Date;
  expires_at: Date;
}

const HistoricalWeatherCacheSchema = new Schema<IHistoricalWeatherCache>(
  {
    cache_key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    season: {
      type: String,
      enum: ['kharif', 'rabi', 'zaid'],
      required: true,
    },
    temperature_avg: {
      type: Number,
      required: true,
    },
    humidity_avg: {
      type: Number,
      required: true,
    },
    rainfall_total_avg: {
      type: Number,
      required: true,
    },
    years_analyzed: {
      type: Number,
      default: 5,
    },
    source: {
      type: String,
      enum: ['open_meteo_archive', 'agro_climatic_normals'],
      default: 'open_meteo_archive',
    },
    cached_at: {
      type: Date,
      default: Date.now,
    },
    expires_at: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index auto-cleans expired records after 30 days
    },
  },
  {
    versionKey: false,
  }
);

export const HistoricalWeatherCache = mongoose.model<IHistoricalWeatherCache>(
  'HistoricalWeatherCache',
  HistoricalWeatherCacheSchema
);
