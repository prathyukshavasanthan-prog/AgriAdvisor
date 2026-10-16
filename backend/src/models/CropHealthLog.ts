import mongoose, { Document, Schema, Types } from 'mongoose';

export type HealthStatusType = 'Healthy' | 'Okay' | 'Concerning';
export type CheckInType = 'manual' | 'ai_diagnosis';

export interface IAIPredictionInfo {
  predicted_class?: string;
  confidence?: 'Low' | 'Medium' | 'High' | string;
  confidence_score?: number;
  is_healthy?: boolean | null;
  general_guidance?: string;
  low_confidence?: boolean;
  trained_on?: string;
}

export interface ICropHealthLog extends Document {
  crop_id: Types.ObjectId;
  farm_id: Types.ObjectId;
  date: Date;
  health_status: HealthStatusType;
  check_in_type: CheckInType;
  ai_prediction?: IAIPredictionInfo;
  notes?: string;
  photo_url?: string;
  logged_at: Date;
}

const CropHealthLogSchema: Schema<ICropHealthLog> = new Schema(
  {
    crop_id: {
      type: Schema.Types.ObjectId,
      ref: 'Crop',
      required: [true, 'Crop ID is required'],
      index: true,
    },
    farm_id: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'Farm ID is required'],
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    health_status: {
      type: String,
      enum: {
        values: ['Healthy', 'Okay', 'Concerning'],
        message: '{VALUE} is not a valid health status',
      },
      required: [true, 'Health status is required'],
      index: true,
    },
    check_in_type: {
      type: String,
      enum: ['manual', 'ai_diagnosis'],
      default: 'manual',
      index: true,
    },
    ai_prediction: {
      predicted_class: { type: String },
      confidence: { type: String },
      confidence_score: { type: Number },
      is_healthy: { type: Boolean },
      general_guidance: { type: String },
      low_confidence: { type: Boolean, default: false },
      trained_on: { type: String, default: 'real_dataset' },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    photo_url: {
      type: String,
      trim: true,
      default: '',
    },
    logged_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

// Compound index for quick chronological retrieval per crop
CropHealthLogSchema.index({ crop_id: 1, logged_at: -1 });
CropHealthLogSchema.index({ farm_id: 1, logged_at: -1 });

export const CropHealthLog = mongoose.model<ICropHealthLog>('CropHealthLog', CropHealthLogSchema);
