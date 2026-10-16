import { CropPredictionLog, IrrigationPredictionLog } from '../models/PredictionLogs.js';
import { Types } from 'mongoose';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export interface CropPredictionInput {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  userId?: string | Types.ObjectId;
  farmId?: string | Types.ObjectId;
}

export interface CropPredictionResult {
  available: boolean;
  recommended_crop?: string;
  confidence?: 'Low' | 'Medium' | 'High' | string;
  confidence_score?: number;
  alternatives?: string[];
  trained_on?: string;
  messageKey?: string;
  error?: string;
}

export interface IrrigationPredictionInput {
  days_since_rain: number;
  days_since_last_irrigation: number;
  soil_type: string;
  forecast_rain_probability: number;
  forecast_rain_amount: number;
  crop_type: string;
  userId?: string | Types.ObjectId;
  farmId?: string | Types.ObjectId;
}

export interface IrrigationPredictionResult {
  available: boolean;
  recommended_action?: 'Irrigate' | 'Delay Irrigation' | 'Monitor' | 'No Action Needed' | string;
  urgency_level?: 'Low' | 'Medium' | 'High' | string;
  confidence?: 'Low' | 'Medium' | 'High' | string;
  confidence_score?: number;
  top_reasons?: string[];
  trained_on?: string;
  messageKey?: string;
  error?: string;
}

/**
 * Predict optimal crop based on soil and climate variables.
 * Strictly uses Model 1 (RandomForestClassifier on ICAR 2200-sample dataset).
 * No rule-based / threshold fallbacks.
 */
export const predictCrop = async (
  input: CropPredictionInput
): Promise<CropPredictionResult> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${ML_SERVICE_URL}/predict/crop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        N: input.N,
        P: input.P,
        K: input.K,
        temperature: input.temperature,
        humidity: input.humidity,
        ph: input.ph,
        rainfall: input.rainfall,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[ML Client] /predict/crop responded with status ${res.status}`);
      return {
        available: false,
        messageKey: 'ai_crop_unavailable',
        error: `ML service error: HTTP ${res.status}`,
      };
    }

    const data = await res.json();

    // Log prediction to MongoDB crop_prediction_log for auditing and model retraining
    try {
      await CropPredictionLog.create({
        user: input.userId ? new Types.ObjectId(input.userId.toString()) : null,
        farm: input.farmId ? new Types.ObjectId(input.farmId.toString()) : null,
        input_features: {
          N: input.N,
          P: input.P,
          K: input.K,
          temperature: input.temperature,
          humidity: input.humidity,
          ph: input.ph,
          rainfall: input.rainfall,
        },
        recommended_crop: data.recommended_crop,
        confidence: data.confidence,
        confidence_score: data.confidence_score,
        alternatives: data.alternatives,
        trained_on: data.trained_on,
      });
    } catch (logErr) {
      console.error('[ML Client] Failed to log crop prediction:', logErr);
    }

    return {
      available: true,
      recommended_crop: data.recommended_crop,
      confidence: data.confidence,
      confidence_score: data.confidence_score,
      alternatives: data.alternatives,
      trained_on: data.trained_on,
    };
  } catch (err: any) {
    console.warn('[ML Client] Crop model request failed:', err.message);
    // Return neutral unavailable state, NO fallback heuristic rule
    return {
      available: false,
      messageKey: 'ai_crop_unavailable',
      error: 'ML crop recommendation service is currently unavailable.',
    };
  }
};

/**
 * Predict irrigation urgency and action.
 * Strictly uses Model 2 (RandomForestClassifier trained on synthetic bootstrap data).
 * No rule-based / threshold fallbacks.
 */
export const predictIrrigation = async (
  input: IrrigationPredictionInput
): Promise<IrrigationPredictionResult> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${ML_SERVICE_URL}/predict/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        days_since_rain: input.days_since_rain,
        days_since_last_irrigation: input.days_since_last_irrigation,
        soil_type: input.soil_type,
        forecast_rain_probability: input.forecast_rain_probability,
        forecast_rain_amount: input.forecast_rain_amount,
        crop_type: input.crop_type,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[ML Client] /predict/irrigation responded with status ${res.status}`);
      return {
        available: false,
        messageKey: 'ai_insights_unavailable',
        error: `ML service error: HTTP ${res.status}`,
      };
    }

    const data = await res.json();

    // Log prediction to MongoDB irrigation_prediction_log for auditing and model retraining
    try {
      await IrrigationPredictionLog.create({
        user: input.userId ? new Types.ObjectId(input.userId.toString()) : null,
        farm: input.farmId ? new Types.ObjectId(input.farmId.toString()) : null,
        input_features: {
          days_since_rain: input.days_since_rain,
          days_since_last_irrigation: input.days_since_last_irrigation,
          soil_type: input.soil_type,
          forecast_rain_probability: input.forecast_rain_probability,
          forecast_rain_amount: input.forecast_rain_amount,
          crop_type: input.crop_type,
        },
        recommended_action: data.recommended_action,
        urgency_level: data.urgency_level,
        confidence: data.confidence,
        confidence_score: data.confidence_score,
        top_reasons: data.top_reasons,
        trained_on: data.trained_on,
      });
    } catch (logErr) {
      console.error('[ML Client] Failed to log irrigation prediction:', logErr);
    }

    return {
      available: true,
      recommended_action: data.recommended_action,
      urgency_level: data.urgency_level,
      confidence: data.confidence,
      confidence_score: data.confidence_score,
      top_reasons: data.top_reasons,
      trained_on: data.trained_on,
    };
  } catch (err: any) {
    console.warn('[ML Client] Irrigation model request failed:', err.message);
    // Return neutral unavailable state, NO fallback heuristic rule
    return {
      available: false,
      messageKey: 'ai_insights_unavailable',
      error: 'AI recommendation service is temporarily unavailable.',
    };
  }
};

export interface CropHealthPredictionResult {
  available: boolean;
  predicted_class?: string;
  crop?: string;
  condition?: string;
  confidence?: 'Low' | 'Medium' | 'High' | string;
  confidence_score?: number;
  is_healthy?: boolean | null;
  general_guidance?: string;
  low_confidence?: boolean;
  trained_on?: string;
  error?: string;
}

/**
 * Predict crop health condition from leaf photograph using Model 3 (Transfer Learning on PlantVillage)
 */
export const predictCropHealth = async (
  imageBase64: string,
  cropContext?: string
): Promise<CropHealthPredictionResult> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${ML_SERVICE_URL}/predict/crop-health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: imageBase64,
        crop_context: cropContext,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[ML Client] /predict/crop-health failed with status ${res.status}: ${errText}`);
      return {
        available: false,
        error: `ML service error: HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      available: true,
      predicted_class: data.predicted_class,
      crop: data.crop,
      condition: data.condition,
      confidence: data.confidence,
      confidence_score: data.confidence_score,
      is_healthy: data.is_healthy,
      general_guidance: data.general_guidance,
      low_confidence: data.low_confidence,
      trained_on: data.trained_on,
    };
  } catch (err: any) {
    console.error('[ML Client] predictCropHealth error:', err);
    return {
      available: false,
      error: err.message || 'Failed to connect to ML health diagnostic service',
    };
  }
};

