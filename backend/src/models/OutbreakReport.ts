import mongoose, { Document, Schema, Types } from 'mongoose';
import { IGeoJSONPoint } from './Farm.js';

export interface IOutbreakReport extends Document {
  cropType: string;
  concern: string;
  location: IGeoJSONPoint;
  reportedAt: Date;
  farmId: Types.ObjectId;
  isDemo: boolean;
}

const LocationPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  { _id: false }
);

const OutbreakReportSchema: Schema<IOutbreakReport> = new Schema(
  {
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    concern: {
      type: String,
      required: [true, 'Concern is required'],
      trim: true,
      default: 'general concern',
    },
    location: {
      type: LocationPointSchema,
      required: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
  }
);

// 2dsphere index for MongoDB geospatial queries
OutbreakReportSchema.index({ location: '2dsphere' });
OutbreakReportSchema.index({ cropType: 1, reportedAt: -1 });

export const OutbreakReport = mongoose.model<IOutbreakReport>('OutbreakReport', OutbreakReportSchema);
