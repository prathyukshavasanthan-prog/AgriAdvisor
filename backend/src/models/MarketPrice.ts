import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketPrice extends Document {
  crop_type: string;
  market: string;
  state: string;
  price: number;
  min_price?: number;
  max_price?: number;
  price_date: Date;
  source: 'agmarknet_live' | 'agmarknet_dataset';
  created_at: Date;
}

const MarketPriceSchema: Schema<IMarketPrice> = new Schema(
  {
    crop_type: {
      type: String,
      required: [true, 'Crop type is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    market: {
      type: String,
      required: [true, 'Market name is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    min_price: {
      type: Number,
      min: 0,
    },
    max_price: {
      type: Number,
      min: 0,
    },
    price_date: {
      type: Date,
      required: [true, 'Price date is required'],
      index: true,
    },
    source: {
      type: String,
      enum: ['agmarknet_live', 'agmarknet_dataset'],
      default: 'agmarknet_dataset',
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

// Compound index for querying historical price snapshots by crop and date
MarketPriceSchema.index({ crop_type: 1, price_date: -1 }, { unique: true });

export const MarketPrice = mongoose.model<IMarketPrice>('MarketPrice', MarketPriceSchema);
