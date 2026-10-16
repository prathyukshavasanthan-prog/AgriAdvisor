import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICropPredictionLog extends Document {
  user?: Types.ObjectId;
  farm?: Types.ObjectId;
  input_features: {
    N: number;
    P: number;
    K: number;
    temperature: number;
    humidity: number;
    ph: number;
    rainfall: number;
  };
  recommended_crop: string;
  confidence: string;
  confidence_score: number;
  alternatives: string[];
  trained_on: string;
  timestamp: Date;
}

const CropPredictionLogSchema: Schema<ICropPredictionLog> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', default: null },
    input_features: { type: Schema.Types.Mixed, required: true },
    recommended_crop: { type: String, required: true },
    confidence: { type: String, required: true },
    confidence_score: { type: Number, default: 0 },
    alternatives: [{ type: String }],
    trained_on: { type: String, default: 'real_dataset' },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: 'crop_prediction_log', versionKey: false }
);

export const CropPredictionLog = mongoose.model<ICropPredictionLog>(
  'CropPredictionLog',
  CropPredictionLogSchema
);

export interface IIrrigationPredictionLog extends Document {
  user?: Types.ObjectId;
  farm?: Types.ObjectId;
  input_features: {
    days_since_rain: number;
    days_since_last_irrigation: number;
    soil_type: string;
    forecast_rain_probability: number;
    forecast_rain_amount: number;
    crop_type: string;
  };
  recommended_action: string;
  urgency_level: string;
  confidence: string;
  confidence_score: number;
  top_reasons: string[];
  trained_on: string;
  timestamp: Date;
}

const IrrigationPredictionLogSchema: Schema<IIrrigationPredictionLog> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', default: null },
    input_features: { type: Schema.Types.Mixed, required: true },
    recommended_action: { type: String, required: true },
    urgency_level: { type: String, required: true },
    confidence: { type: String, required: true },
    confidence_score: { type: Number, default: 0 },
    top_reasons: [{ type: String }],
    trained_on: { type: String, default: 'synthetic_bootstrap' },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: 'irrigation_prediction_log', versionKey: false }
);

export const IrrigationPredictionLog = mongoose.model<IIrrigationPredictionLog>(
  'IrrigationPredictionLog',
  IrrigationPredictionLogSchema
);
