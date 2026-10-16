import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // [ [ [lng, lat], [lng, lat], ... ] ]
}

export interface IGeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IFarm extends Document {
  user: Types.ObjectId;
  name: string;
  latitude: number;
  longitude: number;
  area: number;
  boundary?: IGeoJSONPolygon;
  location?: IGeoJSONPoint;
  soil_type: string;
  soil_health_card: boolean;
  soil_n: number;
  soil_p: number;
  soil_k: number;
  soil_ph: number;
  created_at: Date;
}

const BoundaryPolygonSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true,
      default: 'Polygon',
    },
    coordinates: {
      type: [[[Number]]],
      required: true,
    },
  },
  { _id: false }
);

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

const FarmSchema: Schema<IFarm> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    area: {
      type: Number,
      required: [true, 'Area (in acres) is required'],
      min: [0.1, 'Area must be at least 0.1 acres'],
    },
    boundary: {
      type: BoundaryPolygonSchema,
      required: false,
      default: undefined,
    },
    location: {
      type: LocationPointSchema,
      required: false,
    },
    soil_type: {
      type: String,
      required: [true, 'Soil type is required'],
      enum: ['clay', 'sandy', 'loamy', 'black', 'red', 'alluvial'],
      default: 'loamy',
    },
    soil_health_card: {
      type: Boolean,
      default: false,
    },
    soil_n: {
      type: Number,
      default: 90,
      min: 0,
      max: 200,
    },
    soil_p: {
      type: Number,
      default: 42,
      min: 0,
      max: 200,
    },
    soil_k: {
      type: Number,
      default: 43,
      min: 0,
      max: 250,
    },
    soil_ph: {
      type: Number,
      default: 6.5,
      min: 3.0,
      max: 10.0,
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

// 2dsphere index for MongoDB geospatial queries
FarmSchema.index({ location: '2dsphere' });

// Ensure location GeoJSON Point is synced whenever lat/lng are set or updated
FarmSchema.pre('save', function (next) {
  if (this.latitude !== undefined && this.longitude !== undefined) {
    if (!this.location || !this.location.coordinates || this.isModified('latitude') || this.isModified('longitude')) {
      this.location = {
        type: 'Point',
        coordinates: [this.longitude, this.latitude],
      };
    }
  }
  next();
});

export const Farm = mongoose.model<IFarm>('Farm', FarmSchema);
