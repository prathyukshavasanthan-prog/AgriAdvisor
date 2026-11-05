/**
 * Representative Soil Chemistry and Hydrological Benchmark Lookup Table
 * 
 * Sources & Citations:
 * 1. FAO Irrigation and Drainage Paper No. 56 (FAO-56, Table 19: Available soil water capacity AWHC)
 * 2. Indian Council of Agricultural Research (ICAR) and National Bureau of Soil Survey
 *    and Land Use Planning (NBSS&LUP) regional soil classification averages across Indian agro-ecological zones.
 * 
 * NOTE: All values below (N, P, K, pH, and AWHC) are representative regional approximations intended
 * for cultivators who do not possess a formal Soil Health Card. Farmers who have a certified
 * Soil Health Card should input their specific lab-tested values through the Soil Health Card toggle.
 */

export interface SoilChemistryBenchmark {
  soil_type: string;
  n: number;    // Available Nitrogen in kg/ha (approximate regional baseline)
  p: number;    // Available Phosphorus in kg/ha (approximate regional baseline)
  k: number;    // Available Potassium in kg/ha (approximate regional baseline)
  ph: number;   // Soil reaction on pH scale (approximate regional baseline)
  awhc: number; // Available Water Holding Capacity in mm/m (FAO-56 Table 19 benchmark)
  color_hex: string; // Color swatch for visual identification (no stock photos)
  label: string;
  description: string;
}

export const SOIL_TYPE_BENCHMARKS: Record<string, SoilChemistryBenchmark> = {
  alluvial: {
    soil_type: 'alluvial',
    n: 85,
    p: 50,
    k: 110,
    ph: 7.0,
    awhc: 175, // FAO-56: Silt loam / alluvial deposits (130-190 mm/m)
    color_hex: '#8C7A5B',
    label: 'Alluvial Soil',
    description: 'Fertile river basin sediment, balanced potash and lime, neutral reaction with excellent nutrient exchange.',
  },
  black: {
    soil_type: 'black',
    n: 55,
    p: 35,
    k: 180,
    ph: 7.8,
    awhc: 200, // FAO-56 & ICAR Vertisols: Heavy montmorillonitic swelling clay (180-220 mm/m)
    color_hex: '#262320',
    label: 'Black Soil (Regur)',
    description: 'Deccan trap clayey soil, rich in calcium, magnesium, and potassium; high water retention; cracks when dry.',
  },
  red: {
    soil_type: 'red',
    n: 60,
    p: 30,
    k: 80,
    ph: 6.2,
    awhc: 110, // FAO-56: Sandy clay loam / Alfisols (90-130 mm/m)
    color_hex: '#A34834',
    label: 'Red Soil',
    description: 'Formed from ancient metamorphic rocks; rich in iron oxides; porous structure, mildly acidic with moderate drainage.',
  },
  laterite: {
    soil_type: 'laterite',
    n: 45,
    p: 25,
    k: 65,
    ph: 5.5,
    awhc: 100, // FAO-56: Strongly leached kaolinitic oxisols (80-120 mm/m)
    color_hex: '#B85333',
    label: 'Laterite Soil',
    description: 'Intensely leached tropical soil rich in iron and aluminium; acidic reaction with lower organic matter.',
  },
  sandy: {
    soil_type: 'sandy',
    n: 35,
    p: 20,
    k: 50,
    ph: 6.8,
    awhc: 60, // FAO-56: Coarse sand (40-80 mm/m)
    color_hex: '#D4B27C',
    label: 'Sandy Soil',
    description: 'Coarse loose particles, very high percolation rate, minimal water holding capacity, requires frequent watering.',
  },
  sandy_loam: {
    soil_type: 'sandy_loam',
    n: 50,
    p: 28,
    k: 70,
    ph: 6.6,
    awhc: 125, // FAO-56: Sandy loam (90-150 mm/m)
    color_hex: '#BA9C72',
    label: 'Sandy Loam',
    description: 'Friable blend of sand with moderate clay and silt; warms up quickly with favorable aeration and workable tilth.',
  },
  loamy: {
    soil_type: 'loamy',
    n: 90,
    p: 45,
    k: 95,
    ph: 6.5,
    awhc: 170, // FAO-56: Loam (130-180 mm/m)
    color_hex: '#6B5B43',
    label: 'Loamy Soil',
    description: 'Ideal agricultural blend of sand, silt, and clay; optimal drainage, balanced moisture retention, and high natural fertility.',
  },
  silty: {
    soil_type: 'silty',
    n: 80,
    p: 42,
    k: 100,
    ph: 6.8,
    awhc: 190, // FAO-56: Silt / silt loam (140-200 mm/m)
    color_hex: '#7A6E5D',
    label: 'Silty Soil',
    description: 'Fine smooth particles feeling like flour when dry; high moisture retention with good capillary water movement.',
  },
  clay_loam: {
    soil_type: 'clay_loam',
    n: 80,
    p: 38,
    k: 130,
    ph: 7.0,
    awhc: 180, // FAO-56: Clay loam (130-190 mm/m)
    color_hex: '#5E4A3B',
    label: 'Clay Loam',
    description: 'Substantial clay fraction with ample silt and sand; aggregates well with strong nutrient-retention capacity.',
  },
  clay: {
    soil_type: 'clay',
    n: 75,
    p: 40,
    k: 140,
    ph: 6.9,
    awhc: 160, // FAO-56: Dense clay (110-170 mm/m)
    color_hex: '#4A3E38',
    label: 'Clay Soil',
    description: 'Dense fine-grained texture; very sticky when wet and hard when dry; high potassium and excellent moisture holding.',
  },
  saline_alkaline: {
    soil_type: 'saline_alkaline',
    n: 40,
    p: 22,
    k: 120,
    ph: 8.6,
    awhc: 120, // ICAR Solonchak / Usar benchmark
    color_hex: '#C2BBB0',
    label: 'Saline / Alkaline Soil',
    description: 'High concentration of soluble sodium and carbonates; whitish surface crust; requires gypsum or leaching amendment.',
  },
  peaty_marshy: {
    soil_type: 'peaty_marshy',
    n: 70,
    p: 25,
    k: 60,
    ph: 4.8,
    awhc: 220, // FAO-56: Histosols / peats (>200 mm/m)
    color_hex: '#211E1A',
    label: 'Peaty / Marshy Soil',
    description: 'Abundant un-decomposed organic matter and dark humus; spongy texture formed in waterlogged and wetland areas.',
  },
  desert_arid: {
    soil_type: 'desert_arid',
    n: 25,
    p: 15,
    k: 75,
    ph: 8.0,
    awhc: 50, // FAO-56: Aridisols (30-65 mm/m)
    color_hex: '#DEC18E',
    label: 'Desert / Arid Soil',
    description: 'Light sandy aeolian soil of western drylands; low moisture and low organic nitrogen with high mineral salts.',
  },
  hill_forest: {
    soil_type: 'hill_forest',
    n: 95,
    p: 30,
    k: 85,
    ph: 5.8,
    awhc: 140, // ICAR Hill & forest soils
    color_hex: '#444D36',
    label: 'Hill / Forest Soil',
    description: 'Formed under forest canopy on slope gradients; rich surface humus layer with mild acidity and good crumb structure.',
  },
};

/**
 * Validated list of all 14 soil type identifiers
 */
export const VALID_SOIL_TYPES = Object.keys(SOIL_TYPE_BENCHMARKS) as (keyof typeof SOIL_TYPE_BENCHMARKS)[];

/**
 * Returns soil chemistry and AWHC defaults for a given soil type.
 * Marked as approximations in line with ICAR / FAO-56 guidance.
 */
export const getSoilDefaults = (soilType: string): SoilChemistryBenchmark => {
  const normalized = (soilType || 'loamy').toLowerCase().trim();
  return SOIL_TYPE_BENCHMARKS[normalized] || SOIL_TYPE_BENCHMARKS.loamy;
};

/**
 * Deterministic fixed-mapping table for the 3-tap "Not sure" soil classification helper:
 * Question 1: Stickiness when wet: 'very_sticky' | 'moderately_sticky' | 'slightly_sticky' | 'not_sticky_gritty'
 * Question 2: Drainage speed: 'very_fast' | 'moderate' | 'slow_waterlogs'
 * Question 3: Soil color: 'deep_black' | 'red_brown' | 'light_yellow_grey' | 'dark_organic' | 'whitish_crust'
 *
 * Deterministic rules map any combination directly to the nearest of the 14 standard soil types.
 */
export const resolveSoilTypeFromTapQuestions = (
  sticky: 'very_sticky' | 'moderately_sticky' | 'slightly_sticky' | 'not_sticky_gritty' | string,
  drainage: 'very_fast' | 'moderate' | 'slow_waterlogs' | string,
  color: 'deep_black' | 'red_brown' | 'light_yellow_grey' | 'dark_organic' | 'whitish_crust' | string
): string => {
  // 1. Whitish surface crust indicates salinity
  if (color === 'whitish_crust') {
    return 'saline_alkaline';
  }

  // 2. Dark organic spongy soil with slow drainage indicates peaty/marshy
  if (color === 'dark_organic') {
    if (drainage === 'slow_waterlogs' || sticky === 'moderately_sticky') {
      return 'peaty_marshy';
    }
    return 'hill_forest';
  }

  // 3. Deep black clayey soil
  if (color === 'deep_black') {
    if (sticky === 'very_sticky' || drainage === 'slow_waterlogs') {
      return 'black';
    }
    return 'clay_loam';
  }

  // 4. Red/Brown soils
  if (color === 'red_brown') {
    if (drainage === 'very_fast') {
      return 'laterite';
    }
    if (sticky === 'very_sticky') {
      return 'clay_loam';
    }
    return 'red';
  }

  // 5. Coarse gritty non-sticky soils
  if (sticky === 'not_sticky_gritty') {
    if (color === 'light_yellow_grey' && drainage === 'very_fast') {
      return 'desert_arid';
    }
    return 'sandy';
  }

  // 6. Slightly sticky soils
  if (sticky === 'slightly_sticky') {
    if (drainage === 'very_fast') {
      return 'sandy_loam';
    }
    if (drainage === 'slow_waterlogs') {
      return 'silty';
    }
    return 'alluvial';
  }

  // 7. Very sticky soils
  if (sticky === 'very_sticky') {
    if (drainage === 'slow_waterlogs') {
      return 'clay';
    }
    return 'clay_loam';
  }

  // 8. Moderately sticky soils
  if (drainage === 'moderate') {
    return 'loamy';
  }
  if (drainage === 'slow_waterlogs') {
    return 'clay_loam';
  }

  // Default balanced agricultural loam fallback
  return 'loamy';
};
