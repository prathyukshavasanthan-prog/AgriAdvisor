import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWeatherHistory extends Document {
  farm?: Types.ObjectId;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  precipitation: number;
  weather_code: number;
  wind_speed: number;
  fetched_at: Date;
}

const WeatherHistorySchema: Schema<IWeatherHistory> = new Schema(
  {
    farm: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      default: null,
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
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
    },
    precipitation: {
      type: Number,
      default: 0,
    },
    weather_code: {
      type: Number,
      default: 0,
    },
    wind_speed: {
      type: Number,
      default: 0,
    },
    fetched_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
    collection: 'weather_history',
  }
);

export const WeatherHistory = mongoose.model<IWeatherHistory>('WeatherHistory', WeatherHistorySchema);
