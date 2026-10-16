import {
  CROP_LIFECYCLE_DATA,
  DEFAULT_CROP_LIFECYCLE,
  ICropLifecycleInfo,
  ICropMilestone,
} from '../data/cropLifecycleData.js';

export interface ISowingAdvisory {
  crop_type: string;
  display_name: string;
  season: string;
  seasonKey: string;
  sowing_window: string;
  sowing_months: number[];
  typical_days_to_harvest: number;
  current_month: number;
  is_in_sowing_window: boolean;
  is_land_prep_window: boolean;
  sowing_status: 'in_season' | 'approaching_sowing' | 'outside_window';
  sowing_note: string;
  sowing_noteKey: string;
  land_preparation_guidance: string;
  land_preparationKey: string;
  land_prep_active: boolean;
}

export interface ICropLifecycleDetails {
  crop_id: string;
  farm_id?: string;
  crop_type: string;
  display_name: string;
  sowing_date: Date;
  expected_harvest_date: Date;
  days_elapsed: number;
  total_duration_days: number;
  progress_percentage: number;
  current_stage: {
    stage: string;
    stage_name: string;
    stageKey: string;
    day_start: number;
    day_end: number;
    description: string;
  };
  next_milestone: {
    stage: string;
    stage_name: string;
    stageKey: string;
    days_until: number;
  };
  milestones: Array<{
    stage: string;
    stage_name: string;
    stageKey: string;
    day_start: number;
    day_end: number;
    description: string;
    completed: boolean;
    current: boolean;
  }>;
  sowing_advisory: ISowingAdvisory;
}

/**
 * Normalize crop string to lookup key
 */
export function normalizeCropName(cropName: string): string {
  if (!cropName) return 'default';
  const clean = cropName.toLowerCase().trim().replace(/[\s\-_()]/g, '');
  
  // Direct match
  if (CROP_LIFECYCLE_DATA[clean]) return clean;

  // Partial match search
  for (const key of Object.keys(CROP_LIFECYCLE_DATA)) {
    if (clean.includes(key) || key.includes(clean)) {
      return key;
    }
  }

  // Common aliases
  if (clean.includes('paddy') || clean.includes('dhan')) return 'rice';
  if (clean.includes('corn') || clean.includes('makka')) return 'maize';
  if (clean.includes('chana') || clean.includes('gram')) return 'chickpea';
  if (clean.includes('rajma')) return 'kidneybeans';
  if (clean.includes('arhar') || clean.includes('tur')) return 'pigeonpeas';
  if (clean.includes('moong')) return 'mungbean';
  if (clean.includes('urad')) return 'blackgram';
  if (clean.includes('masoor')) return 'lentil';
  if (clean.includes('tarbuj')) return 'watermelon';
  if (clean.includes('kharbooja')) return 'muskmelon';
  if (clean.includes('kapas')) return 'cotton';

  return 'default';
}

/**
 * Retrieve reference crop lifecycle info
 */
export function getCropLifecycleInfo(cropType: string): ICropLifecycleInfo {
  const normalized = normalizeCropName(cropType);
  return CROP_LIFECYCLE_DATA[normalized] || DEFAULT_CROP_LIFECYCLE;
}

/**
 * Evaluate Sowing Window and Land Preparation status based on current/given date
 */
export function getSowingAdvisory(
  cropType: string,
  referenceDate: Date = new Date()
): ISowingAdvisory {
  const cropInfo = getCropLifecycleInfo(cropType);
  const currentMonth = referenceDate.getMonth() + 1; // 1-12
  const nextMonth = (currentMonth % 12) + 1;

  const isInSowingWindow = cropInfo.sowing_months.includes(currentMonth);
  // Land preparation window is typically 1-2 weeks before sowing (i.e. upcoming month or late current month)
  const isLandPrepWindow = !isInSowingWindow && cropInfo.sowing_months.includes(nextMonth);

  let sowingStatus: 'in_season' | 'approaching_sowing' | 'outside_window';
  let sowingNote = '';
  let sowingNoteKey = '';

  if (isInSowingWindow) {
    sowingStatus = 'in_season';
    sowingNote = `Optimal sowing window right now (${cropInfo.sowing_window_label}, ${cropInfo.season} season).`;
    sowingNoteKey = 'sowing_in_season_note';
  } else if (isLandPrepWindow) {
    sowingStatus = 'approaching_sowing';
    sowingNote = `Sowing window begins soon in ${cropInfo.sowing_window_label} (${cropInfo.season} season). Land preparation is recommended now.`;
    sowingNoteKey = 'sowing_approaching_note';
  } else {
    sowingStatus = 'outside_window';
    sowingNote = `Best sown between ${cropInfo.sowing_window_label} (${cropInfo.season} season) — outside that optimal window right now.`;
    sowingNoteKey = 'sowing_out_of_season_note';
  }

  return {
    crop_type: cropInfo.crop_type,
    display_name: cropInfo.display_name,
    season: cropInfo.season,
    seasonKey: cropInfo.seasonKey,
    sowing_window: cropInfo.sowing_window_label,
    sowing_months: cropInfo.sowing_months,
    typical_days_to_harvest: cropInfo.typical_days_to_harvest,
    current_month: currentMonth,
    is_in_sowing_window: isInSowingWindow,
    is_land_prep_window: isLandPrepWindow,
    sowing_status: sowingStatus,
    sowing_note: sowingNote,
    sowing_noteKey: sowingNoteKey,
    land_preparation_guidance: cropInfo.land_preparation_guidance,
    land_preparationKey: cropInfo.land_preparationKey,
    land_prep_active: isLandPrepWindow || isInSowingWindow,
  };
}

/**
 * Calculate full growth milestone progression for an active crop
 */
export function calculateCropLifecycle(
  crop: {
    _id?: any;
    farm?: any;
    crop_type: string;
    sowing_date: Date | string;
    expected_harvest_date?: Date | string;
  },
  referenceDate: Date = new Date()
): ICropLifecycleDetails {
  const cropInfo = getCropLifecycleInfo(crop.crop_type);
  const sowingDate = new Date(crop.sowing_date);
  const now = new Date(referenceDate);

  // Days elapsed since sowing
  const diffTime = now.getTime() - sowingDate.getTime();
  const daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  const totalDuration = cropInfo.typical_days_to_harvest;

  // Expected harvest date
  let expectedHarvest: Date;
  if (crop.expected_harvest_date) {
    expectedHarvest = new Date(crop.expected_harvest_date);
  } else {
    expectedHarvest = new Date(sowingDate.getTime() + totalDuration * 24 * 60 * 60 * 1000);
  }

  const progressPercentage = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDuration) * 100)));

  // Identify milestones
  const milestonesList = cropInfo.milestones.map((m) => {
    const completed = daysElapsed > m.day_end;
    const current = daysElapsed >= m.day_start && daysElapsed <= m.day_end;
    return {
      stage: m.stage,
      stage_name: m.stage_name,
      stageKey: m.stageKey,
      day_start: m.day_start,
      day_end: m.day_end,
      description: m.description,
      completed,
      current,
    };
  });

  // Determine current stage & next milestone
  let currentStage: ICropMilestone;
  let nextMilestone = {
    stage: 'harvest',
    stage_name: 'Harvest Ready',
    stageKey: 'stage_harvest',
    days_until: Math.max(0, totalDuration - daysElapsed),
  };

  const matchedIndex = milestonesList.findIndex((m) => m.current);
  if (matchedIndex !== -1) {
    currentStage = cropInfo.milestones[matchedIndex];
    if (matchedIndex < cropInfo.milestones.length - 1) {
      const next = cropInfo.milestones[matchedIndex + 1];
      nextMilestone = {
        stage: next.stage,
        stage_name: next.stage_name,
        stageKey: next.stageKey,
        days_until: Math.max(1, next.day_start - daysElapsed),
      };
    } else {
      nextMilestone = {
        stage: 'harvest',
        stage_name: 'Harvest Ready',
        stageKey: 'stage_harvest',
        days_until: Math.max(0, totalDuration - daysElapsed),
      };
    }
  } else if (daysElapsed > totalDuration) {
    // Past total duration - harvest ready or harvested
    currentStage = {
      stage: 'harvest_ready',
      stage_name: 'Ready for Harvest',
      stageKey: 'stage_harvest',
      day_start: totalDuration,
      day_end: totalDuration + 30,
      description: 'Crop has attained physiological harvest maturity.',
    };
    nextMilestone = {
      stage: 'harvested',
      stage_name: 'Harvested',
      stageKey: 'crop_status_harvested',
      days_until: 0,
    };
  } else {
    // Fallback to first milestone
    currentStage = cropInfo.milestones[0];
    nextMilestone = {
      stage: cropInfo.milestones[1]?.stage || 'vegetative',
      stage_name: cropInfo.milestones[1]?.stage_name || 'Vegetative Growth',
      stageKey: cropInfo.milestones[1]?.stageKey || 'stage_vegetative',
      days_until: Math.max(1, (cropInfo.milestones[1]?.day_start || 15) - daysElapsed),
    };
  }

  const sowingAdvisory = getSowingAdvisory(crop.crop_type, referenceDate);

  return {
    crop_id: String(crop._id || ''),
    farm_id: crop.farm ? String(crop.farm) : undefined,
    crop_type: crop.crop_type,
    display_name: cropInfo.display_name,
    sowing_date: sowingDate,
    expected_harvest_date: expectedHarvest,
    days_elapsed: daysElapsed,
    total_duration_days: totalDuration,
    progress_percentage: progressPercentage,
    current_stage: {
      stage: currentStage.stage,
      stage_name: currentStage.stage_name,
      stageKey: currentStage.stageKey,
      day_start: currentStage.day_start,
      day_end: currentStage.day_end,
      description: currentStage.description,
    },
    next_milestone: nextMilestone,
    milestones: milestonesList,
    sowing_advisory: sowingAdvisory,
  };
}
