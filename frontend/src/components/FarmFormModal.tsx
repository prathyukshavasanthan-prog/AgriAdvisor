import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Sprout, 
  Sparkles, 
  MapPin, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FlaskConical,
  FileCheck,
  Compass,
  Droplets,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { FarmBoundaryDrawer } from './FarmBoundaryDrawer.js';

interface FarmFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (farmData: any) => void;
  farmToEdit?: any | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const SOIL_TYPE_BENCHMARKS: Record<
  string,
  {
    n: number;
    p: number;
    k: number;
    ph: number;
    awhc: number;
    nameKey: string;
    descKey: string;
    colorHex: string;
  }
> = {
  alluvial: {
    n: 85,
    p: 50,
    k: 110,
    ph: 7.0,
    awhc: 175,
    nameKey: 'farm_soil_alluvial',
    descKey: 'soil_alluvial_desc',
    colorHex: '#8C7A5B',
  },
  black: {
    n: 55,
    p: 35,
    k: 180,
    ph: 7.8,
    awhc: 200,
    nameKey: 'farm_soil_black',
    descKey: 'soil_black_desc',
    colorHex: '#262320',
  },
  red: {
    n: 60,
    p: 30,
    k: 80,
    ph: 6.2,
    awhc: 110,
    nameKey: 'farm_soil_red',
    descKey: 'soil_red_desc',
    colorHex: '#A34834',
  },
  laterite: {
    n: 45,
    p: 25,
    k: 65,
    ph: 5.5,
    awhc: 100,
    nameKey: 'farm_soil_laterite',
    descKey: 'soil_laterite_desc',
    colorHex: '#B85333',
  },
  sandy: {
    n: 35,
    p: 20,
    k: 50,
    ph: 6.8,
    awhc: 60,
    nameKey: 'farm_soil_sandy',
    descKey: 'soil_sandy_desc',
    colorHex: '#D4B27C',
  },
  sandy_loam: {
    n: 50,
    p: 28,
    k: 70,
    ph: 6.6,
    awhc: 125,
    nameKey: 'farm_soil_sandy_loam',
    descKey: 'soil_sandy_loam_desc',
    colorHex: '#BA9C72',
  },
  loamy: {
    n: 90,
    p: 45,
    k: 95,
    ph: 6.5,
    awhc: 170,
    nameKey: 'farm_soil_loamy',
    descKey: 'soil_loamy_desc',
    colorHex: '#6B5B43',
  },
  silty: {
    n: 80,
    p: 42,
    k: 100,
    ph: 6.8,
    awhc: 190,
    nameKey: 'farm_soil_silty',
    descKey: 'soil_silty_desc',
    colorHex: '#7A6E5D',
  },
  clay_loam: {
    n: 80,
    p: 38,
    k: 130,
    ph: 7.0,
    awhc: 180,
    nameKey: 'farm_soil_clay_loam',
    descKey: 'soil_clay_loam_desc',
    colorHex: '#5E4A3B',
  },
  clay: {
    n: 75,
    p: 40,
    k: 140,
    ph: 6.9,
    awhc: 160,
    nameKey: 'farm_soil_clay',
    descKey: 'soil_clay_desc',
    colorHex: '#4A3E38',
  },
  saline_alkaline: {
    n: 40,
    p: 22,
    k: 120,
    ph: 8.6,
    awhc: 120,
    nameKey: 'farm_soil_saline_alkaline',
    descKey: 'soil_saline_alkaline_desc',
    colorHex: '#C2BBB0',
  },
  peaty_marshy: {
    n: 70,
    p: 25,
    k: 60,
    ph: 4.8,
    awhc: 220,
    nameKey: 'farm_soil_peaty_marshy',
    descKey: 'soil_peaty_marshy_desc',
    colorHex: '#211E1A',
  },
  desert_arid: {
    n: 25,
    p: 15,
    k: 75,
    ph: 8.0,
    awhc: 50,
    nameKey: 'farm_soil_desert_arid',
    descKey: 'soil_desert_arid_desc',
    colorHex: '#DEC18E',
  },
  hill_forest: {
    n: 95,
    p: 30,
    k: 85,
    ph: 5.8,
    awhc: 140,
    nameKey: 'farm_soil_hill_forest',
    descKey: 'soil_hill_forest_desc',
    colorHex: '#444D36',
  },
};

export const LAND_TYPES = [
  { key: 'irrigated', labelKey: 'land_type_irrigated' },
  { key: 'rainfed', labelKey: 'land_type_rainfed' },
  { key: 'lowland_paddy', labelKey: 'land_type_lowland_paddy' },
  { key: 'upland', labelKey: 'land_type_upland' },
  { key: 'terraced_hill', labelKey: 'land_type_terraced_hill' },
  { key: 'raised_beds', labelKey: 'land_type_raised_beds' },
  { key: 'polyhouse', labelKey: 'land_type_polyhouse' },
  { key: 'orchard_plantation', labelKey: 'land_type_orchard_plantation' },
] as const;

export const WATER_SOURCES = [
  { key: 'borewell', labelKey: 'water_source_borewell' },
  { key: 'open_well', labelKey: 'water_source_open_well' },
  { key: 'canal', labelKey: 'water_source_canal' },
  { key: 'tank_pond', labelKey: 'water_source_tank_pond' },
  { key: 'rain_only', labelKey: 'water_source_rain_only' },
] as const;

export const IRRIGATION_METHODS = [
  { key: 'flood', labelKey: 'irrig_method_flood' },
  { key: 'furrow', labelKey: 'irrig_method_furrow' },
  { key: 'drip', labelKey: 'irrig_method_drip' },
  { key: 'sprinkler', labelKey: 'irrig_method_sprinkler' },
  { key: 'none', labelKey: 'irrig_method_none' },
] as const;

export const resolveSoilTypeFromTapQuestions = (
  sticky: string,
  drainage: string,
  color: string
): string => {
  if (color === 'white_crust') return 'saline_alkaline';
  if (color === 'dark_organic') {
    return drainage === 'slow' || sticky === 'mod_sticky' ? 'peaty_marshy' : 'hill_forest';
  }
  if (color === 'black') {
    return sticky === 'very_sticky' || drainage === 'slow' ? 'black' : 'clay_loam';
  }
  if (color === 'red') {
    if (drainage === 'very_fast') return 'laterite';
    if (sticky === 'very_sticky') return 'clay_loam';
    return 'red';
  }
  if (sticky === 'not_sticky') {
    if (color === 'yellow_grey' && drainage === 'very_fast') return 'desert_arid';
    return 'sandy';
  }
  if (sticky === 'slight_sticky') {
    if (drainage === 'very_fast') return 'sandy_loam';
    if (drainage === 'slow') return 'silty';
    return 'alluvial';
  }
  if (sticky === 'very_sticky') {
    return drainage === 'slow' ? 'clay' : 'clay_loam';
  }
  if (drainage === 'moderate') return 'loamy';
  if (drainage === 'slow') return 'clay_loam';
  return 'loamy';
};

export const FarmFormModal: React.FC<FarmFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  farmToEdit = null,
}) => {
  const { t } = useTranslation();
  const { token, user } = useAuth();

  const [name, setName] = useState('');
  const [areaAcres, setAreaAcres] = useState<number>(3.5);
  const [sizeUnit, setSizeUnit] = useState<'acres' | 'hectares' | 'cents'>('acres');
  const [displayArea, setDisplayArea] = useState<string>('3.5');
  const [boundary, setBoundary] = useState<any | null>(null);
  const [isAutoArea, setIsAutoArea] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<number>(user?.latitude || 21.1458);
  const [longitude, setLongitude] = useState<number>(user?.longitude || 79.0882);
  const [soilType, setSoilType] = useState('loamy');

  // Land type, water source, and irrigation method (Phase 1)
  const [landType, setLandType] = useState('irrigated');
  const [waterSource, setWaterSource] = useState('borewell');
  const [irrigationMethod, setIrrigationMethod] = useState('flood');

  // Soil Health Card Toggle: true = entered from Soil Health Card; false = derived from soil category
  const [hasSoilHealthCard, setHasSoilHealthCard] = useState<boolean>(false);

  // Soil parameters with sensible defaults
  const [soilN, setSoilN] = useState<number>(90);
  const [soilP, setSoilP] = useState<number>(45);
  const [soilK, setSoilK] = useState<number>(95);
  const [soilPh, setSoilPh] = useState<number>(6.5);

  // 3-Tap Questions "Not sure" state
  const [showTapQuestions, setShowTapQuestions] = useState<boolean>(false);
  const [tapSticky, setTapSticky] = useState<string>('mod_sticky');
  const [tapDrainage, setTapDrainage] = useState<string>('moderate');
  const [tapColor, setTapColor] = useState<string>('yellow_grey');
  const [matchedSoilType, setMatchedSoilType] = useState<string>('loamy');

  // Crop cycle details
  const [cropType, setCropType] = useState('wheat');
  const [sowingDate, setSowingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [harvestDate, setHarvestDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 110);
    return d.toISOString().split('T')[0];
  });

  // AI Recommendation State (Model 1: Crop Recommendation)
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRec, setAiRec] = useState<{
    available: boolean;
    recommended_crop?: string;
    confidence?: string;
    confidence_score?: number;
    alternatives?: string[];
    trained_on?: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync displayArea when unit or areaAcres changes
  const toDisplayValue = useCallback((acres: number, unit: 'acres' | 'hectares' | 'cents'): string => {
    if (unit === 'acres') return acres.toFixed(2);
    if (unit === 'hectares') return (acres / 2.47105).toFixed(2);
    if (unit === 'cents') return (acres * 100).toFixed(1);
    return acres.toFixed(2);
  }, []);

  const fromDisplayValue = useCallback((val: number, unit: 'acres' | 'hectares' | 'cents'): number => {
    if (unit === 'acres') return val;
    if (unit === 'hectares') return Number((val * 2.47105).toFixed(4));
    if (unit === 'cents') return Number((val / 100).toFixed(4));
    return val;
  }, []);

  // Update matched soil when tap questions change
  useEffect(() => {
    const res = resolveSoilTypeFromTapQuestions(tapSticky, tapDrainage, tapColor);
    setMatchedSoilType(res);
  }, [tapSticky, tapDrainage, tapColor]);

  // Callback from FarmBoundaryDrawer when polygon is drawn or cleared
  const handleBoundaryChange = useCallback(
    (data: {
      boundary: { type: 'Polygon'; coordinates: number[][][] } | null;
      areaAcres: number;
      center: { lat: number; lng: number };
    }) => {
      setBoundary(data.boundary);
      if (data.boundary && data.areaAcres > 0) {
        setAreaAcres(data.areaAcres);
        setDisplayArea(toDisplayValue(data.areaAcres, sizeUnit));
        setIsAutoArea(true);
        setLatitude(data.center.lat);
        setLongitude(data.center.lng);
      } else {
        setIsAutoArea(false);
      }
    },
    [sizeUnit, toDisplayValue]
  );

  // Populate data when editing an existing farm
  useEffect(() => {
    if (farmToEdit) {
      setName(farmToEdit.name || '');
      const ac = farmToEdit.area || 3.5;
      const u = farmToEdit.size_unit || 'acres';
      setAreaAcres(ac);
      setSizeUnit(u);
      setDisplayArea(toDisplayValue(ac, u));
      setBoundary(farmToEdit.boundary || null);
      setIsAutoArea(!!farmToEdit.boundary);
      setLatitude(farmToEdit.latitude || 21.1458);
      setLongitude(farmToEdit.longitude || 79.0882);
      setSoilType(farmToEdit.soil_type || 'loamy');
      setLandType(farmToEdit.land_type || 'irrigated');
      setWaterSource(farmToEdit.water_source || 'borewell');
      setIrrigationMethod(farmToEdit.irrigation_method || 'flood');
      setHasSoilHealthCard(farmToEdit.soil_health_card ?? false);
      setSoilN(farmToEdit.soil_n ?? 90);
      setSoilP(farmToEdit.soil_p ?? 45);
      setSoilK(farmToEdit.soil_k ?? 95);
      setSoilPh(farmToEdit.soil_ph ?? 6.5);

      if (farmToEdit.activeCrop) {
        setCropType(farmToEdit.activeCrop.crop_type || 'wheat');
        if (farmToEdit.activeCrop.sowing_date) {
          setSowingDate(new Date(farmToEdit.activeCrop.sowing_date).toISOString().split('T')[0]);
        }
        if (farmToEdit.activeCrop.expected_harvest_date) {
          setHarvestDate(new Date(farmToEdit.activeCrop.expected_harvest_date).toISOString().split('T')[0]);
        }
      }
    } else {
      setName('');
      setAreaAcres(3.5);
      setSizeUnit('acres');
      setDisplayArea('3.50');
      setBoundary(null);
      setIsAutoArea(false);
      setLatitude(user?.latitude || 21.1458);
      setLongitude(user?.longitude || 79.0882);
      setSoilType('loamy');
      setLandType('irrigated');
      setWaterSource('borewell');
      setIrrigationMethod('flood');
      setHasSoilHealthCard(false);
      const defaults = SOIL_TYPE_BENCHMARKS['loamy'];
      setSoilN(defaults.n);
      setSoilP(defaults.p);
      setSoilK(defaults.k);
      setSoilPh(defaults.ph);
    }
  }, [farmToEdit, user, isOpen, toDisplayValue]);

  // Handler for unit change
  const handleUnitChange = (newUnit: 'acres' | 'hectares' | 'cents') => {
    setSizeUnit(newUnit);
    setDisplayArea(toDisplayValue(areaAcres, newUnit));
  };

  // Handler for area input edit
  const handleAreaInputChange = (valStr: string) => {
    setDisplayArea(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const normalized = fromDisplayValue(num, sizeUnit);
      setAreaAcres(normalized);
      setIsAutoArea(false);
    }
  };

  // Handler for selecting soil type (updates N/P/K/pH if no Soil Health Card)
  const handleSoilTypeSelect = (selectedType: string) => {
    setSoilType(selectedType);
    if (!hasSoilHealthCard) {
      const bench = SOIL_TYPE_BENCHMARKS[selectedType] || SOIL_TYPE_BENCHMARKS.loamy;
      setSoilN(bench.n);
      setSoilP(bench.p);
      setSoilK(bench.k);
      setSoilPh(bench.ph);
    }
  };

  // Handler for Soil Health Card toggle
  const handleSoilHealthCardToggle = (hasCard: boolean) => {
    setHasSoilHealthCard(hasCard);
    if (!hasCard) {
      const bench = SOIL_TYPE_BENCHMARKS[soilType] || SOIL_TYPE_BENCHMARKS.loamy;
      setSoilN(bench.n);
      setSoilP(bench.p);
      setSoilK(bench.k);
      setSoilPh(bench.ph);
    }
  };

  // Query Model 1 Crop Recommendation from Backend
  const fetchCropRecommendation = useCallback(async () => {
    if (!token) return;
    setLoadingAI(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/farms/recommend-crop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          soil_n: Number(soilN),
          soil_p: Number(soilP),
          soil_k: Number(soilK),
          soil_ph: Number(soilPh),
          latitude: Number(latitude),
          longitude: Number(longitude),
          land_type: landType,
          water_source: waterSource,
          irrigation_method: irrigationMethod,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAiRec(data);
      } else {
        setAiRec({ available: false });
      }
    } catch (err: any) {
      console.warn('[FarmForm] Failed to fetch crop recommendation:', err);
      setAiRec({ available: false });
    } finally {
      setLoadingAI(false);
    }
  }, [soilN, soilP, soilK, soilPh, latitude, longitude, landType, waterSource, irrigationMethod, token]);

  // Debounced auto-fetch whenever soil parameters change
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchCropRecommendation();
    }, 600);
    return () => clearTimeout(timer);
  }, [soilN, soilP, soilK, soilPh, landType, waterSource, isOpen, fetchCropRecommendation]);

  // Handle GPS detection
  const handleDetectGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(4)));
          setLongitude(Number(pos.coords.longitude.toFixed(4)));
        },
        () => {
          setLatitude(21.1458);
          setLongitude(79.0882);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage(t('err_name_required'));
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      area: Number(areaAcres.toFixed(4)),
      size_unit: sizeUnit,
      boundary: boundary || undefined,
      latitude: Number(latitude),
      longitude: Number(longitude),
      soil_type: soilType,
      soil_health_card: hasSoilHealthCard,
      soil_n: Number(soilN),
      soil_p: Number(soilP),
      soil_k: Number(soilK),
      soil_ph: Number(soilPh),
      land_type: landType,
      water_source: waterSource,
      irrigation_method: irrigationMethod,
      crop: {
        crop_type: cropType,
        sowing_date: sowingDate,
        expected_harvest_date: harvestDate,
        status: 'growing',
      },
    };

    try {
      const url = farmToEdit
        ? `${API_BASE_URL}/api/farms/${farmToEdit._id}`
        : `${API_BASE_URL}/api/farms`;

      const method = farmToEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setErrorMessage(resData.message || t('err_generic'));
        setSubmitting(false);
        return;
      }

      onSuccess(resData.data);
      onClose();
    } catch (err: any) {
      console.error('[FarmForm] Submit error:', err);
      setErrorMessage(err.message || t('err_generic'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-white border border-[#D8D5C5] rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#1E4620] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Sprout className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {farmToEdit ? t('btn_edit_farm') : t('btn_add_farm')}
              </h2>
              <p className="text-xs text-stone-200">
                {t('farms_page_sub')}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-farm-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm p-3.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Plot Identity */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <span>{t('farm_details_heading')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('farm_field_name')} *
                </label>
                <input
                  type="text"
                  required
                  id="farm-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. North Canal Plot"
                  className="w-full h-11 px-3.5 rounded-xl border border-stone-300 bg-[#FBFBF9] text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">
                    {t('farm_field_area')} *
                  </label>
                  {isAutoArea && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>{t('farm_boundary_auto_calc')}</span>
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    id="farm-area-input"
                    value={displayArea}
                    onChange={(e) => handleAreaInputChange(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-stone-300 bg-[#FBFBF9] text-stone-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                  />
                  {/* Unit Selector: acres, hectares, cents */}
                  <div className="flex rounded-xl border border-stone-300 bg-[#FBFBF9] p-1 shrink-0">
                    {(['acres', 'hectares', 'cents'] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        id={`size-unit-btn-${u}`}
                        onClick={() => handleUnitChange(u)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          sizeUnit === u
                            ? 'bg-[#1E4620] text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {t(`unit_${u}` as any)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Farm Boundary Drawer (GIS Polygon on Leaflet Map) */}
            <FarmBoundaryDrawer
              initialBoundary={farmToEdit?.boundary}
              initialCenter={{ lat: latitude, lng: longitude }}
              onBoundaryChange={handleBoundaryChange}
            />

            {/* GPS coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('farm_field_lat')}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  id="farm-lat-input"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-[#FBFBF9] text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('farm_field_lng')}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  id="farm-lng-input"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-[#FBFBF9] text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                />
              </div>
            </div>

            <button
              type="button"
              id="detect-gps-btn"
              onClick={handleDetectGPS}
              className="text-xs text-[#1E4620] hover:underline font-bold flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('btn_use_gps')}</span>
            </button>
          </div>

          <hr className="border-stone-200" />

          {/* Section 1b: Land Type, Water Source, Irrigation Method (Phase 1) */}
          <div className="space-y-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-900/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5 mb-2">
                <Layers className="w-4 h-4 text-[#1E4620]" />
                {t('land_type_heading')}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LAND_TYPES.map((lt) => (
                  <button
                    key={lt.key}
                    type="button"
                    id={`land-type-btn-${lt.key}`}
                    onClick={() => setLandType(lt.key)}
                    className={`p-2 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      landType === lt.key
                        ? 'border-[#1E4620] bg-white ring-2 ring-[#1E4620]/20 text-[#1E4620] font-bold shadow-xs'
                        : 'border-stone-200 bg-white/70 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    {t(lt.labelKey as any)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-emerald-900/10">
              <div>
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-700" />
                  {t('water_source_heading')}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {WATER_SOURCES.map((ws) => (
                    <button
                      key={ws.key}
                      type="button"
                      id={`water-source-btn-${ws.key}`}
                      onClick={() => setWaterSource(ws.key)}
                      className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        waterSource === ws.key
                          ? 'border-[#1E4620] bg-white font-bold text-[#1E4620] ring-1 ring-[#1E4620]'
                          : 'border-stone-200 bg-white/70 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {t(ws.labelKey as any)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                  {t('irrig_method_heading')}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {IRRIGATION_METHODS.map((im) => (
                    <button
                      key={im.key}
                      type="button"
                      id={`irrig-method-btn-${im.key}`}
                      onClick={() => setIrrigationMethod(im.key)}
                      className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        irrigationMethod === im.key
                          ? 'border-[#1E4620] bg-white font-bold text-[#1E4620] ring-1 ring-[#1E4620]'
                          : 'border-stone-200 bg-white/70 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {t(im.labelKey as any)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-stone-200" />

          {/* Section 2: Soil Input (Soil Health Card Toggle vs Soil Category Picker) */}
          <div className="space-y-4 bg-[#FBFBF9] p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-[#1E4620]" />
                {t('farm_soil_test_badge')}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                hasSoilHealthCard 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : 'bg-stone-100 text-stone-700 border-stone-300'
              }`}>
                {hasSoilHealthCard ? t('shc_badge_verified') : t('shc_badge_estimated')}
              </span>
            </div>

            {/* Toggle Buttons: "I have a Soil Health Card" vs "I don't have one" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                id="shc-toggle-yes-btn"
                onClick={() => handleSoilHealthCardToggle(true)}
                className={`p-3 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                  hasSoilHealthCard
                    ? 'border-[#1E4620] bg-emerald-50/70 shadow-xs ring-1 ring-[#1E4620]'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  hasSoilHealthCard ? 'bg-[#1E4620] text-white' : 'bg-stone-100 text-stone-500'
                }`}>
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span>{t('shc_toggle_has_card')}</span>
                    {hasSoilHealthCard && <CheckCircle2 className="w-3.5 h-3.5 text-[#1E4620]" />}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-tight">
                    Enter lab test values (N, P, K, pH)
                  </p>
                </div>
              </button>

              <button
                type="button"
                id="shc-toggle-no-btn"
                onClick={() => handleSoilHealthCardToggle(false)}
                className={`p-3 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                  !hasSoilHealthCard
                    ? 'border-[#1E4620] bg-emerald-50/70 shadow-xs ring-1 ring-[#1E4620]'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  !hasSoilHealthCard ? 'bg-[#1E4620] text-white' : 'bg-stone-100 text-stone-500'
                }`}>
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span>{t('shc_toggle_no_card')}</span>
                    {!hasSoilHealthCard && <CheckCircle2 className="w-3.5 h-3.5 text-[#1E4620]" />}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-tight">
                    Select soil category (ICAR benchmark averages)
                  </p>
                </div>
              </button>
            </div>

            {/* PATH A: Farmer has Soil Health Card -> Show N, P, K, pH inputs */}
            {hasSoilHealthCard ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-stone-600 font-medium bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                  {t('shc_helper_note')}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {t('farm_field_soil_n')} (kg/ha)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      id="soil-n-input"
                      value={soilN}
                      onChange={(e) => setSoilN(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-stone-800 text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {t('farm_field_soil_p')} (kg/ha)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      id="soil-p-input"
                      value={soilP}
                      onChange={(e) => setSoilP(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-stone-800 text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {t('farm_field_soil_k')} (kg/ha)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="250"
                      id="soil-k-input"
                      value={soilK}
                      onChange={(e) => setSoilK(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-stone-800 text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {t('farm_field_soil_ph')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="3.0"
                      max="10.0"
                      id="soil-ph-input"
                      value={soilPh}
                      onChange={(e) => setSoilPh(parseFloat(e.target.value) || 6.5)}
                      className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-stone-800 text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* PATH B: Farmer does not have card -> Show 14 soil categories with color swatches + "Not sure" */
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <div>
                    <span className="text-xs font-bold text-stone-800">
                      {t('soil_cat_picker_title')}
                    </span>
                    <p className="text-[11px] text-stone-500">
                      {t('soil_cat_picker_desc')}
                    </p>
                  </div>

                  {/* "Not sure" Button */}
                  <button
                    type="button"
                    id="soil-not-sure-btn"
                    onClick={() => setShowTapQuestions(true)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>{t('farm_soil_not_sure')}</span>
                  </button>
                </div>

                {/* 14 Soil Types Grid with color swatches (no stock photos) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(SOIL_TYPE_BENCHMARKS).map(([key, bench]) => {
                    const isSelected = soilType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        id={`soil-cat-btn-${key}`}
                        onClick={() => handleSoilTypeSelect(key)}
                        className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#1E4620] bg-white ring-2 ring-[#1E4620]/20 shadow-xs'
                            : 'border-stone-200 bg-white/70 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-2">
                            {/* Color Swatch (Circle with authentic soil hue) */}
                            <span 
                              className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-xs" 
                              style={{ backgroundColor: bench.colorHex }}
                              aria-hidden="true"
                            />
                            <span className="text-xs font-bold text-stone-900 leading-tight">
                              {t(bench.nameKey as any)}
                            </span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#1E4620] shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                          {t(bench.descKey as any)}
                        </p>
                        <div className="mt-1.5 pt-1 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-600 font-semibold">
                          <span>N:{bench.n} P:{bench.p}</span>
                          <span>AWHC: {bench.awhc}mm</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Benchmark citation notice */}
                <div className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-start gap-2 text-[11px] text-amber-900">
                  <Info className="w-3.5 h-3.5 shrink-0 text-amber-700 mt-0.5" />
                  <span>{t('shc_fallback_note')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2b: 3-Tap Questions Modal/Panel ("Not Sure") */}
          {showTapQuestions && (
            <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-800" />
                    <span>{t('tap_q_title')}</span>
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    {t('tap_q_sub')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTapQuestions(false)}
                  className="w-7 h-7 rounded-full bg-amber-200/60 hover:bg-amber-200 flex items-center justify-center text-amber-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Q1: Stickiness */}
              <div>
                <label className="block text-[11px] font-bold text-amber-950 mb-1">
                  {t('tap_q1_label')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'very_sticky', labelKey: 'tap_q1_opt_very_sticky' },
                    { key: 'mod_sticky', labelKey: 'tap_q1_opt_mod_sticky' },
                    { key: 'slight_sticky', labelKey: 'tap_q1_opt_slight_sticky' },
                    { key: 'not_sticky', labelKey: 'tap_q1_opt_not_sticky' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      id={`tap-q1-${opt.key}`}
                      onClick={() => setTapSticky(opt.key)}
                      className={`p-2 rounded-xl border text-left text-[11px] transition-all cursor-pointer ${
                        tapSticky === opt.key
                          ? 'bg-amber-600 text-white font-bold border-amber-700 shadow-xs'
                          : 'bg-white/80 text-amber-900 border-amber-200 hover:bg-white'
                      }`}
                    >
                      {t(opt.labelKey as any)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: Drainage */}
              <div>
                <label className="block text-[11px] font-bold text-amber-950 mb-1">
                  {t('tap_q2_label')}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'very_fast', labelKey: 'tap_q2_opt_very_fast' },
                    { key: 'moderate', labelKey: 'tap_q2_opt_moderate' },
                    { key: 'slow', labelKey: 'tap_q2_opt_slow' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      id={`tap-q2-${opt.key}`}
                      onClick={() => setTapDrainage(opt.key)}
                      className={`p-2 rounded-xl border text-left text-[11px] transition-all cursor-pointer ${
                        tapDrainage === opt.key
                          ? 'bg-amber-600 text-white font-bold border-amber-700 shadow-xs'
                          : 'bg-white/80 text-amber-900 border-amber-200 hover:bg-white'
                      }`}
                    >
                      {t(opt.labelKey as any)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3: Colour */}
              <div>
                <label className="block text-[11px] font-bold text-amber-950 mb-1">
                  {t('tap_q3_label')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { key: 'black', labelKey: 'tap_q3_opt_black' },
                    { key: 'red', labelKey: 'tap_q3_opt_red' },
                    { key: 'yellow_grey', labelKey: 'tap_q3_opt_yellow_grey' },
                    { key: 'dark_organic', labelKey: 'tap_q3_opt_dark_organic' },
                    { key: 'white_crust', labelKey: 'tap_q3_opt_white_crust' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      id={`tap-q3-${opt.key}`}
                      onClick={() => setTapColor(opt.key)}
                      className={`p-2 rounded-xl border text-left text-[11px] transition-all cursor-pointer ${
                        tapColor === opt.key
                          ? 'bg-amber-600 text-white font-bold border-amber-700 shadow-xs'
                          : 'bg-white/80 text-amber-900 border-amber-200 hover:bg-white'
                      }`}
                    >
                      {t(opt.labelKey as any)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matched Outcome & Apply Button */}
              <div className="pt-2 border-t border-amber-300 flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-2">
                  <span 
                    className="w-4 h-4 rounded-full border border-black/20"
                    style={{ backgroundColor: SOIL_TYPE_BENCHMARKS[matchedSoilType]?.colorHex || '#6B5B43' }}
                  />
                  <span>
                    {t('tap_result_matched', {
                      soilName: t(SOIL_TYPE_BENCHMARKS[matchedSoilType]?.nameKey as any || 'farm_soil_loamy'),
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  id="apply-tap-soil-btn"
                  onClick={() => {
                    handleSoilTypeSelect(matchedSoilType);
                    setShowTapQuestions(false);
                  }}
                  className="px-4 py-2 bg-[#1E4620] hover:bg-[#163719] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('tap_btn_apply')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 3: AI Crop Recommendation Card (Model 1: Real ICAR Data) */}
          <div className="bg-white border-2 border-emerald-700/20 rounded-2xl p-4 shadow-xs relative">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-[#1E4620]">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-[#14251B]">
                  {t('ai_crop_rec_title')}
                </h3>
              </div>

              {/* Verified ICAR Data source badge with tooltip */}
              <div className="group relative flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-help">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{t('data_source_real_badge')}</span>
                <Info className="w-3 h-3 text-emerald-700" />
                <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block w-64 bg-stone-900 text-white text-[11px] p-2 rounded-xl shadow-lg z-50">
                  {t('data_source_real_tooltip')}
                </div>
              </div>
            </div>

            {loadingAI ? (
              <div className="py-4 text-center text-xs text-stone-500 font-medium flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#1E4620] border-t-transparent rounded-full animate-spin" />
                <span>{t('analyzing_soil_chemistry', 'Analyzing soil chemistry against agricultural benchmarks...')}</span>
              </div>
            ) : aiRec && aiRec.available && aiRec.recommended_crop ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center font-bold">
                      <Sprout className="w-5 h-5 text-[#2D6A4F]" />
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black text-[#1E4620] capitalize tracking-tight">
                        {String(t(`crop_${aiRec.recommended_crop}` as any, aiRec.recommended_crop))}
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        {t('ai_crop_confidence')}: <strong className="text-stone-700">{aiRec.confidence || 'High'} ({Math.round((aiRec.confidence_score || 0.95) * 100)}%)</strong>
                      </div>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    type="button"
                    id="apply-ai-crop-btn"
                    onClick={() => {
                      if (aiRec.recommended_crop) {
                        setCropType(aiRec.recommended_crop);
                      }
                    }}
                    className="h-9 px-3.5 bg-[#EBF5EE] hover:bg-[#d5eed9] text-[#1E4620] border border-[#2D6A4F]/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('ai_crop_btn_apply')}</span>
                  </button>
                </div>

                {/* Filtered for land notice */}
                <div className="text-[11px] text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{t('filtered_for_land')}</span>
                </div>

                {/* Alternatives */}
                {aiRec.alternatives && aiRec.alternatives.length > 0 && (
                  <div className="pt-2 border-t border-stone-100 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-stone-500">{t('ai_crop_alternatives')}:</span>
                    {aiRec.alternatives.map((alt) => (
                      <button
                        key={alt}
                        type="button"
                        onClick={() => setCropType(alt)}
                        className="px-2.5 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 transition-colors capitalize"
                      >
                        {String(t(`crop_${alt}` as any, alt))}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2.5 text-xs text-stone-600 bg-stone-50 rounded-xl p-3 border border-stone-200 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-stone-400 flex-shrink-0" />
                <span>{t('ai_crop_unavailable')}</span>
              </div>
            )}
          </div>

          {/* Section 4: Initial Crop Cycle Setup */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {t('crop_heading')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('crop_type_label')} *
                </label>
                <input
                  type="text"
                  required
                  id="crop-type-input"
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value.toLowerCase())}
                  placeholder="e.g. rice, wheat, cotton"
                  className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-[#FBFBF9] text-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('crop_sowing_date')}
                </label>
                <input
                  type="date"
                  required
                  id="crop-sowing-date-input"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-[#FBFBF9] text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('crop_harvest_date')}
                </label>
                <input
                  type="date"
                  required
                  id="crop-harvest-date-input"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-[#FBFBF9] text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs sm:text-sm hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-farm-submit-btn"
              disabled={submitting}
              className="h-11 px-6 bg-[#1E4620] hover:bg-[#163719] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('btn_saving_farm')}</span>
                </>
              ) : (
                <span>{t('btn_save_farm')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
