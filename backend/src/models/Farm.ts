import mongoose, { Document, Schema, Types } from 'mongoose';
import { getSoilDefaults } from '../services/soilDefaults.js';

export interface IGeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // [ [ [lng, lat], [lng, lat], ... ] ]
}

export interface IGeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export type LandType =
  | 'irrigated'
  | 'rainfed'
  | 'lowland_paddy'
  | 'upland'
  | 'terraced_hill'
  | 'raised_beds'
  | 'polyhouse'
  | 'orchard_plantation';

export type WaterSource =
  | 'borewell'
  | 'open_well'
  | 'canal'
  | 'tank_pond'
  | 'rain_only';

export type IrrigationMethod =
  | 'flood'
  | 'furrow'
  | 'drip'
  | 'sprinkler'
  | 'none';

export type SizeUnit = 'acres' | 'hectares' | 'cents';

export interface IFarm extends Document {
  user: Types.ObjectId;
  name: string;
  latitude: number;
  longitude: number;
  area: number; // Stored in normalized acres for backend consistency
  size_unit: SizeUnit; // Unit selected by farmer (acres, hectares, cents)
  boundary?: IGeoJSONPolygon;
  location?: IGeoJSONPoint;
  soil_type: string;
  soil_health_card: boolean;
  soil_n: number;
  soil_p: number;
  soil_k: number;
  soil_ph: number;
  awhc: number; // Available water holding capacity in mm/m (from FAO-56 Table 19 approximation)
  land_type: LandType;
  water_source: WaterSource;
  irrigation_method: IrrigationMethod;
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

export const VALID_LAND_TYPES = [
  'irrigated',
  'rainfed',
  'lowland_paddy',
  'upland',
  'terraced_hill',
  'raised_beds',
  'polyhouse',
  'orchard_plantation',
] as const;

export const VALID_WATER_SOURCES = [
  'borewell',
  'open_well',
  'canal',
  'tank_pond',
  'rain_only',
] as const;

export const VALID_IRRIGATION_METHODS = [
  'flood',
  'furrow',
  'drip',
  'sprinkler',
  'none',
] as const;

export const VALID_SIZE_UNITS = ['acres', 'hectares', 'cents'] as const;

export const ALL_SOIL_TYPES = [
  'alluvial',
  'black',
  'red',
  'laterite',
  'sandy',
  'sandy_loam',
  'loamy',
  'silty',
  'clay_loam',
  'clay',
  'saline_alkaline',
  'peaty_marshy',
  'desert_arid',
  'hill_forest',
] as const;

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
      required: [true, 'Area is required'],
      min: [0.01, 'Area must be at least 0.01'],
    },
    size_unit: {
      type: String,
      enum: VALID_SIZE_UNITS,
      default: 'acres',
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
      enum: ALL_SOIL_TYPES,
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
      default: 45,
      min: 0,
      max: 200,
    },
    soil_k: {
      type: Number,
      default: 95,
      min: 0,
      max: 250,
    },
    soil_ph: {
      type: Number,
      default: 6.5,
      min: 3.0,
      max: 10.0,
    },
    awhc: {
      type: Number,
      default: 170, // Available Water Holding Capacity in mm/m
    },
    land_type: {
      type: String,
      enum: VALID_LAND_TYPES,
      default: 'irrigated',
    },
    water_source: {
      type: String,
      enum: VALID_WATER_SOURCES,
      default: 'borewell',
    },
    irrigation_method: {
      type: String,
      enum: VALID_IRRIGATION_METHODS,
      default: 'flood',
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

// Ensure location GeoJSON Point and AWHC are synced whenever lat/lng or soil_type are set
FarmSchema.pre('save', function (next) {
  if (this.latitude !== undefined && this.longitude !== undefined) {
    if (!this.location || !this.location.coordinates || this.isModified('latitude') || this.isModified('longitude')) {
      this.location = {
        type: 'Point',
        coordinates: [this.longitude, this.latitude],
      };
    }
  }

  // Auto-populate AWHC from benchmark lookup if not explicitly provided or if soil_type modified
  if (this.isModified('soil_type') || !this.awhc) {
    const defaults = getSoilDefaults(this.soil_type);
    this.awhc = defaults.awhc;
  }

  next();
});

export const Farm = mongoose.model<IFarm>('Farm', FarmSchema);

/**
 * Migration helper to update older farms with safe defaults for Phase 1 fields:
 * - land_type: 'irrigated'
 * - water_source: 'borewell'
 * - irrigation_method: 'flood'
 * - size_unit: 'acres'
 * - awhc from soilDefaults
 */
export const migrateExistingFarmsPhase1 = async (): Promise<{ migratedCount: number }> => {
  try {
    const farmsToMigrate = await Farm.find({
      $or: [
        { land_type: { $exists: false } },
        { water_source: { $exists: false } },
        { irrigation_method: { $exists: false } },
        { size_unit: { $exists: false } },
        { awhc: { $exists: false } },
      ],
    });

    let count = 0;
    for (const farm of farmsToMigrate) {
      let modified = false;
      if (!farm.land_type) {
        farm.land_type = 'irrigated';
        modified = true;
      }
      if (!farm.water_source) {
        farm.water_source = 'borewell';
        modified = true;
      }
      if (!farm.irrigation_method) {
        farm.irrigation_method = 'flood';
        modified = true;
      }
      if (!farm.size_unit) {
        farm.size_unit = 'acres';
        modified = true;
      }
      if (!farm.awhc) {
        const defaults = getSoilDefaults(farm.soil_type);
        farm.awhc = defaults.awhc;
        modified = true;
      }

      if (modified) {
        await farm.save();
        count++;
      }
    }

    return { migratedCount: count };
  } catch (err: any) {
    console.error('[Migration Phase 1] Error migrating farms:', err);
    return { migratedCount: 0 };
  }
};
