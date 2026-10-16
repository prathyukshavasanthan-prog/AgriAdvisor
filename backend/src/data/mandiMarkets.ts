export interface IMandiMarket {
  id: string;
  name: string;
  market: string;
  state: string;
  latitude: number;
  longitude: number;
  location_type: 'approximate_location';
  major_commodities: string[];
  price_multiplier: number; // Regional market adjustment factor relative to benchmark
}

/**
 * 11 Major APMC Mandi Wholesale Markets across India with authentic geographic coordinates
 * sourced from OpenStreetMap / public agricultural market listings.
 * Note: Marked as 'approximate location' per UI specification.
 */
export const MANDI_MARKETS: IMandiMarket[] = [
  {
    id: 'mandi-delhi-azadpur',
    name: 'Azadpur Mandi',
    market: 'Azadpur Subzi Mandi',
    state: 'Delhi',
    latitude: 28.7161,
    longitude: 77.1732,
    location_type: 'approximate_location',
    major_commodities: ['tomato', 'wheat', 'rice', 'maize'],
    price_multiplier: 1.04, // High urban demand
  },
  {
    id: 'mandi-punjab-khanna',
    name: 'Khanna Grain Market',
    market: 'Khanna APMC',
    state: 'Punjab',
    latitude: 30.7058,
    longitude: 76.2215,
    location_type: 'approximate_location',
    major_commodities: ['wheat', 'rice', 'maize'],
    price_multiplier: 1.02, // Asia's largest grain market
  },
  {
    id: 'mandi-haryana-karnal',
    name: 'Karnal Grain Market',
    market: 'Karnal Mandi',
    state: 'Haryana',
    latitude: 29.6857,
    longitude: 76.9905,
    location_type: 'approximate_location',
    major_commodities: ['rice', 'wheat'],
    price_multiplier: 1.03, // Basmati & premium grain hub
  },
  {
    id: 'mandi-maharashtra-lasalgaon',
    name: 'Lasalgaon APMC',
    market: 'Lasalgaon Market Yard',
    state: 'Maharashtra',
    latitude: 20.1479,
    longitude: 74.2282,
    location_type: 'approximate_location',
    major_commodities: ['tomato', 'wheat', 'maize', 'sugarcane'],
    price_multiplier: 1.01,
  },
  {
    id: 'mandi-maharashtra-vashi',
    name: 'Vashi APMC',
    market: 'Navi Mumbai APMC Yard',
    state: 'Maharashtra',
    latitude: 19.076,
    longitude: 73.0033,
    location_type: 'approximate_location',
    major_commodities: ['rice', 'wheat', 'cotton', 'tomato', 'sugarcane'],
    price_multiplier: 1.05, // Premium metro terminal rate
  },
  {
    id: 'mandi-gujarat-gondal',
    name: 'Gondal APMC',
    market: 'Gondal Market Yard',
    state: 'Gujarat',
    latitude: 21.9619,
    longitude: 70.7989,
    location_type: 'approximate_location',
    major_commodities: ['cotton', 'wheat', 'maize'],
    price_multiplier: 1.02,
  },
  {
    id: 'mandi-gujarat-rajkot',
    name: 'Rajkot APMC',
    market: 'Rajkot Mandi',
    state: 'Gujarat',
    latitude: 22.3039,
    longitude: 70.8022,
    location_type: 'approximate_location',
    major_commodities: ['cotton', 'wheat', 'maize'],
    price_multiplier: 1.01,
  },
  {
    id: 'mandi-andhra-guntur',
    name: 'Guntur Mirchi & Crop Yard',
    market: 'Guntur APMC',
    state: 'Andhra Pradesh',
    latitude: 16.2914,
    longitude: 80.4552,
    location_type: 'approximate_location',
    major_commodities: ['cotton', 'rice', 'maize', 'tomato'],
    price_multiplier: 1.03,
  },
  {
    id: 'mandi-karnataka-yeshwanthpur',
    name: 'Yeshwanthpur APMC Yard',
    market: 'Bangalore APMC',
    state: 'Karnataka',
    latitude: 13.0238,
    longitude: 77.5504,
    location_type: 'approximate_location',
    major_commodities: ['rice', 'maize', 'tomato', 'sugarcane'],
    price_multiplier: 1.03,
  },
  {
    id: 'mandi-tamilnadu-koyambedu',
    name: 'Koyambedu Wholesale Market',
    market: 'Koyambedu APMC',
    state: 'Tamil Nadu',
    latitude: 13.0694,
    longitude: 80.1948,
    location_type: 'approximate_location',
    major_commodities: ['tomato', 'rice', 'sugarcane', 'cotton'],
    price_multiplier: 1.04,
  },
  {
    id: 'mandi-mp-indore',
    name: 'Choithram APMC Mandi',
    market: 'Indore Mandi',
    state: 'Madhya Pradesh',
    latitude: 22.6865,
    longitude: 75.8454,
    location_type: 'approximate_location',
    major_commodities: ['wheat', 'cotton', 'maize'],
    price_multiplier: 1.01,
  },
];

/**
 * Calculate Great-Circle Distance using Haversine formula (in kilometers)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
