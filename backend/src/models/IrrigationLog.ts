import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IIrrigationLog extends Document {
  farm_id: Types.ObjectId;
  user_id: Types.ObjectId;
  date: Date;
  method: 'flood' | 'furrow' | 'drip' | 'sprinkler' | 'none';
  amount_mm: number;
  notes?: string;
  logged_at: Date;
}

const IrrigationLogSchema: Schema = new Schema(
  {
    farm_id: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    method: {
      type: String,
      enum: ['flood', 'furrow', 'drip', 'sprinkler', 'none'],
      default: 'drip',
    },
    amount_mm: {
      type: Number,
      required: true,
      default: 25.0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    logged_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'logged_at', updatedAt: false },
  }
);

// Compound index for efficient 14-day history queries per farm
IrrigationLogSchema.index({ farm_id: 1, date: -1 });

export const IrrigationLog = mongoose.model<IIrrigationLog>('IrrigationLog', IrrigationLogSchema);
