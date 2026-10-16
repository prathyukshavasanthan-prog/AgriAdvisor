import { Types } from 'mongoose';
import { CropHealthLog, ICropHealthLog, HealthStatusType } from '../models/CropHealthLog.js';
import { Crop } from '../models/Crop.js';
import { Farm } from '../models/Farm.js';

export interface CropHealthAlert {
  crop_id: string;
  crop_type: string;
  farm_id: string;
  farm_name: string;
  consecutive_concerning_count: number;
  last_logged_at: Date;
  last_notes?: string;
  message_key: string;
}

/**
 * Calculate the number of consecutive "Concerning" logs starting from the most recent log
 */
export function calculateConcerningStreak(logs: ICropHealthLog[]): number {
  if (!logs || logs.length === 0) return 0;

  // Logs should be ordered most recent first
  const sorted = [...logs].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

  let streak = 0;
  for (const log of sorted) {
    if (log.health_status === 'Concerning') {
      streak += 1;
    } else {
      break; // Streak broken by Healthy or Okay
    }
  }
  return streak;
}

/**
 * Add a new health log entry for a crop
 */
export async function createHealthLog(data: {
  crop_id: Types.ObjectId | string;
  farm_id: Types.ObjectId | string;
  health_status: HealthStatusType;
  check_in_type?: 'manual' | 'ai_diagnosis';
  ai_prediction?: any;
  notes?: string;
  photo_url?: string;
  date?: Date | string;
}): Promise<{ log: ICropHealthLog; consecutive_concerning_count: number; has_concerning_alert: boolean }> {
  const newLog = await CropHealthLog.create({
    crop_id: new Types.ObjectId(data.crop_id),
    farm_id: new Types.ObjectId(data.farm_id),
    health_status: data.health_status,
    check_in_type: data.check_in_type || 'manual',
    ai_prediction: data.ai_prediction,
    notes: data.notes || '',
    photo_url: data.photo_url || '',
    date: data.date ? new Date(data.date) : new Date(),
    logged_at: new Date(),
  });

  // Calculate new streak
  const recentLogs = await CropHealthLog.find({ crop_id: newLog.crop_id })
    .sort({ logged_at: -1 })
    .limit(10);

  const streak = calculateConcerningStreak(recentLogs);

  // Community Disease Outbreaks: If health status is Concerning or AI detected disease, record an OutbreakReport
  try {
    let concernName = 'general concern';
    if (data.ai_prediction?.predicted_class && !data.ai_prediction.is_healthy) {
      concernName = data.ai_prediction.predicted_class;
    } else if (data.notes && data.notes.trim().length > 0) {
      concernName = data.notes.trim();
    }

    if (data.health_status === 'Concerning' || (data.ai_prediction && data.ai_prediction.is_healthy === false)) {
      const { recordOutbreakReportIfConcerning } = await import('./outbreakService.js');
      await recordOutbreakReportIfConcerning({
        farmId: data.farm_id,
        cropId: data.crop_id,
        healthStatus: data.health_status,
        concernName,
        isAiDiagnosis: data.check_in_type === 'ai_diagnosis',
      });
    }
  } catch (err) {
    console.error('[CropHealthService] Failed to record community outbreak report:', err);
  }

  return {
    log: newLog,
    consecutive_concerning_count: streak,
    has_concerning_alert: streak >= 2,
  };
}

/**
 * Fetch health log history for a crop with consecutive concerning streak check
 */
export async function getHealthLogsForCrop(cropId: Types.ObjectId | string): Promise<{
  logs: ICropHealthLog[];
  consecutive_concerning_count: number;
  has_concerning_alert: boolean;
}> {
  const logs = await CropHealthLog.find({ crop_id: new Types.ObjectId(cropId) })
    .sort({ logged_at: -1 })
    .lean();

  const streak = calculateConcerningStreak(logs as any);

  return {
    logs: logs as any,
    consecutive_concerning_count: streak,
    has_concerning_alert: streak >= 2,
  };
}

/**
 * Find all active health alerts across all farms and crops owned by a user
 * Triggered if 2 or more consecutive "Concerning" logs are recorded for any crop.
 */
export async function getUserHealthAlerts(userId: Types.ObjectId | string): Promise<CropHealthAlert[]> {
  const farms = await Farm.find({ user: new Types.ObjectId(userId) }).lean();
  if (!farms || farms.length === 0) return [];

  const farmMap = new Map(farms.map((f) => [f._id.toString(), f.name]));
  const farmIds = farms.map((f) => f._id);

  const crops = await Crop.find({ farm: { $in: farmIds } }).lean();
  if (!crops || crops.length === 0) return [];

  const alerts: CropHealthAlert[] = [];

  for (const crop of crops) {
    const recentLogs = await CropHealthLog.find({ crop_id: crop._id })
      .sort({ logged_at: -1 })
      .limit(10)
      .lean();

    const streak = calculateConcerningStreak(recentLogs as any);

    // Alert triggered if 2 or more consecutive "Concerning" logs are recorded
    if (streak >= 2) {
      const latestLog = recentLogs[0];
      alerts.push({
        crop_id: crop._id.toString(),
        crop_type: crop.crop_type,
        farm_id: crop.farm.toString(),
        farm_name: farmMap.get(crop.farm.toString()) || 'Farm Plot',
        consecutive_concerning_count: streak,
        last_logged_at: latestLog.logged_at,
        last_notes: latestLog.notes,
        message_key: 'crop_health_alert_concerning',
      });
    }
  }

  return alerts;
}
