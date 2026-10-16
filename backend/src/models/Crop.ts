import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICrop extends Document {
  farm: Types.ObjectId;
  crop_type: string;
  sowing_date: Date;
  expected_harvest_date: Date;
  status: 'sown' | 'growing' | 'harvest_ready' | 'harvested';
  current_growth_stage?: string;
  created_at: Date;
}

const CropSchema: Schema<ICrop> = new Schema(
  {
    farm: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    crop_type: {
      type: String,
      required: [true, 'Crop type is required'],
      trim: true,
    },
    sowing_date: {
      type: Date,
      required: [true, 'Sowing date is required'],
    },
    expected_harvest_date: {
      type: Date,
      required: [true, 'Expected harvest date is required'],
    },
    status: {
      type: String,
      enum: ['sown', 'growing', 'harvest_ready', 'harvested'],
      default: 'growing',
    },
    current_growth_stage: {
      type: String,
      default: 'Germination & Nursery',
      trim: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

export const Crop = mongoose.model<ICrop>('Crop', CropSchema);
