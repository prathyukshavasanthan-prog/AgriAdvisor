/**
 * Representative Soil Chemistry Benchmark Lookup Table
 * 
 * Based on Indian Council of Agricultural Research (ICAR) and 
 * National Bureau of Soil Survey and Land Use Planning (NBSS&LUP)
 * regional soil classification averages across major Indian agro-ecological zones.
 * 
 * NOTE: These are representative regional approximations intended for farmers
 * who do not possess a formal Soil Health Card. For lab-precise recommendations,
 * farmers should enter exact parameters from their government-issued Soil Health Card.
 */

export interface SoilChemistryBenchmark {
  soil_type: string;
  n: number;   // Available Nitrogen in kg/ha
  p: number;   // Available Phosphorus in kg/ha
  k: number;   // Available Potassium in kg/ha
  ph: number;  // Soil reaction (pH scale)
  label: string;
  description: string;
}

export const SOIL_TYPE_BENCHMARKS: Record<string, SoilChemistryBenchmark> = {
  black: {
    soil_type: 'black',
    n: 55,
    p: 35,
    k: 180,
    ph: 7.8,
    label: 'Black Soil (Regur)',
    description: 'Deccan trap clayey soil, rich in lime, iron, magnesium, and potassium; moderate phosphorus; low nitrogen.',
  },
  red: {
    soil_type: 'red',
    n: 60,
    p: 30,
    k: 80,
    ph: 6.2,
    label: 'Red Soil',
    description: 'Formed from crystalline metamorphic rocks; low nitrogen and phosphorus; moderate potassium; slightly acidic.',
  },
  alluvial: {
    soil_type: 'alluvial',
    n: 85,
    p: 50,
    k: 110,
    ph: 7.0,
    label: 'Alluvial Soil',
    description: 'River basin deposition soil; highly fertile with balanced potash and lime; neutral reaction.',
  },
  sandy: {
    soil_type: 'sandy',
    n: 35,
    p: 20,
    k: 50,
    ph: 6.8,
    label: 'Sandy Soil',
    description: 'Arid/semi-arid light texture; high percolation and low organic nutrient retention; neutral to mildly acidic.',
  },
  loamy: {
    soil_type: 'loamy',
    n: 90,
    p: 45,
    k: 95,
    ph: 6.5,
    label: 'Loamy Soil',
    description: 'Balanced mix of sand, silt, and clay; optimal drainage and natural nutrient holding capacity.',
  },
  clay: {
    soil_type: 'clay',
    n: 75,
    p: 40,
    k: 140,
    ph: 6.9,
    label: 'Clayey Soil',
    description: 'Fine-grained dense soil with high water holding capacity and strong potassium content.',
  },
};

export const getSoilDefaults = (soilType: string): SoilChemistryBenchmark => {
  const normalized = (soilType || 'loamy').toLowerCase().trim();
  return SOIL_TYPE_BENCHMARKS[normalized] || SOIL_TYPE_BENCHMARKS.loamy;
};
