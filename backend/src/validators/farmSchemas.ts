import { z } from 'zod';
import { ALL_SOIL_TYPES, VALID_LAND_TYPES, VALID_WATER_SOURCES, VALID_IRRIGATION_METHODS, VALID_SIZE_UNITS } from '../models/Farm.js';

export const boundaryPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.array(z.number()))),
});

export const farmCreateSchema = z.object({
  name: z.string().trim().min(2, 'Farm name must be at least 2 characters'),
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  area: z.number().positive('Area must be a positive number').min(0.01),
  size_unit: z.enum(VALID_SIZE_UNITS).default('acres'),
  boundary: boundaryPolygonSchema.nullable().optional(),
  soil_type: z.enum(ALL_SOIL_TYPES).default('loamy'),
  soil_health_card: z.boolean().default(false),
  soil_n: z.number().min(0).max(200).optional(),
  soil_p: z.number().min(0).max(200).optional(),
  soil_k: z.number().min(0).max(250).optional(),
  soil_ph: z.number().min(3.0).max(10.0).optional(),
  awhc: z.number().positive().optional(),
  land_type: z.enum(VALID_LAND_TYPES).default('irrigated'),
  water_source: z.enum(VALID_WATER_SOURCES).default('borewell'),
  irrigation_method: z.enum(VALID_IRRIGATION_METHODS).default('flood'),
});

export const farmUpdateSchema = farmCreateSchema.partial();

export const cropCreateSchema = z.object({
  crop_type: z.string().trim().min(2, 'Crop type must be specified'),
  sowing_date: z.string().or(z.date()).transform((val) => new Date(val)),
  expected_harvest_date: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  status: z.enum(['sown', 'growing', 'harvest_ready', 'harvested']).default('growing'),
  current_growth_stage: z.string().optional(),
});

export const cropUpdateSchema = cropCreateSchema.partial();

export const cropRecommendSchema = z.object({
  soil_type: z.enum(ALL_SOIL_TYPES).optional(),
  soil_health_card: z.boolean().optional(),
  soil_n: z.number().min(0).max(200).optional(),
  soil_p: z.number().min(0).max(200).optional(),
  soil_k: z.number().min(0).max(250).optional(),
  soil_ph: z.number().min(3.0).max(10.0).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  land_type: z.enum(VALID_LAND_TYPES).optional(),
  water_source: z.enum(VALID_WATER_SOURCES).optional(),
  irrigation_method: z.enum(VALID_IRRIGATION_METHODS).optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  rainfall: z.number().optional(),
});

export const cropHealthLogCreateSchema = z.object({
  health_status: z.enum(['Healthy', 'Okay', 'Concerning']),
  check_in_type: z.enum(['manual', 'ai_diagnosis']).default('manual'),
  ai_prediction: z
    .object({
      predicted_class: z.string().optional(),
      confidence: z.string().optional(),
      confidence_score: z.number().optional(),
      is_healthy: z.boolean().nullable().optional(),
      general_guidance: z.string().optional(),
      low_confidence: z.boolean().optional(),
      trained_on: z.string().optional(),
    })
    .optional(),
  notes: z.string().trim().max(500).optional(),
  photo_url: z.string().trim().optional(),
  date: z.string().or(z.date()).optional(),
});

export type FarmCreateInput = z.infer<typeof farmCreateSchema>;
export type FarmUpdateInput = z.infer<typeof farmUpdateSchema>;
export type CropCreateInput = z.infer<typeof cropCreateSchema>;
export type CropUpdateInput = z.infer<typeof cropUpdateSchema>;
export type CropRecommendInput = z.infer<typeof cropRecommendSchema>;
export type CropHealthLogCreateInput = z.infer<typeof cropHealthLogCreateSchema>;
