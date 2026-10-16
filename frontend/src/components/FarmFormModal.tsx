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
  Layers,
  Mountain,
  Waves,
  Sun,
  Box
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
    nameKey: string;
    descKey: string;
    badgeColor: string;
    icon: any;
  }
> = {
  black: {
    n: 55,
    p: 35,
    k: 180,
    ph: 7.8,
    nameKey: 'farm_soil_black',
    descKey: 'soil_black_desc',
    badgeColor: 'bg-stone-900 text-stone-100',
    icon: Layers,
  },
  red: {
    n: 60,
    p: 30,
    k: 80,
    ph: 6.2,
    nameKey: 'farm_soil_red',
    descKey: 'soil_red_desc',
    badgeColor: 'bg-red-800 text-red-100',
    icon: Mountain,
  },
  alluvial: {
    n: 85,
    p: 50,
    k: 110,
    ph: 7.0,
    nameKey: 'farm_soil_alluvial',
    descKey: 'soil_alluvial_desc',
    badgeColor: 'bg-emerald-800 text-emerald-100',
    icon: Waves,
  },
  sandy: {
    n: 35,
    p: 20,
    k: 50,
    ph: 6.8,
    nameKey: 'farm_soil_sandy',
    descKey: 'soil_sandy_desc',
    badgeColor: 'bg-amber-700 text-amber-100',
    icon: Sun,
  },
  loamy: {
    n: 90,
    p: 45,
    k: 95,
    ph: 6.5,
    nameKey: 'farm_soil_loamy',
    descKey: 'soil_loamy_desc',
    badgeColor: 'bg-teal-800 text-teal-100',
    icon: Sprout,
  },
  clay: {
    n: 75,
    p: 40,
    k: 140,
    ph: 6.9,
    nameKey: 'farm_soil_clay',
    descKey: 'soil_clay_desc',
    badgeColor: 'bg-indigo-800 text-indigo-100',
    icon: Box,
  },
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
  const [area, setArea] = useState<number>(3.5);
  const [boundary, setBoundary] = useState<any | null>(null);
  const [isAutoArea, setIsAutoArea] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<number>(user?.latitude || 21.1458);
  const [longitude, setLongitude] = useState<number>(user?.longitude || 79.0882);
  const [soilType, setSoilType] = useState('loamy');

  // Soil Health Card Toggle: true = entered from Soil Health Card; false = derived from soil category
  const [hasSoilHealthCard, setHasSoilHealthCard] = useState<boolean>(false);

  // Soil parameters with sensible defaults as specified in requirements
  const [soilN, setSoilN] = useState<number>(90);
  const [soilP, setSoilP] = useState<number>(45);
  const [soilK, setSoilK] = useState<number>(95);
  const [soilPh, setSoilPh] = useState<number>(6.5);

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

  // Callback from FarmBoundaryDrawer when polygon is drawn or cleared
  const handleBoundaryChange = useCallback(
    (data: {
      boundary: { type: 'Polygon'; coordinates: number[][][] } | null;
      areaAcres: number;
      center: { lat: number; lng: number };
    }) => {
      setBoundary(data.boundary);
      if (data.boundary && data.areaAcres > 0) {
        setArea(data.areaAcres);
        setIsAutoArea(true);
        setLatitude(data.center.lat);
        setLongitude(data.center.lng);
      } else {
        setIsAutoArea(false);
      }
    },
    []
  );

  // Populate data when editing an existing farm
  useEffect(() => {
    if (farmToEdit) {
      setName(farmToEdit.name || '');
      setArea(farmToEdit.area || 3.5);
      setBoundary(farmToEdit.boundary || null);
      setIsAutoArea(!!farmToEdit.boundary);
      setLatitude(farmToEdit.latitude || 21.1458);
      setLongitude(farmToEdit.longitude || 79.0882);
      setSoilType(farmToEdit.soil_type || 'loamy');
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
      setArea(3.5);
      setBoundary(null);
      setIsAutoArea(false);
      setLatitude(user?.latitude || 21.1458);
      setLongitude(user?.longitude || 79.0882);
      setSoilType('loamy');
      setHasSoilHealthCard(false);
      const defaults = SOIL_TYPE_BENCHMARKS['loamy'];
      setSoilN(defaults.n);
      setSoilP(defaults.p);
      setSoilK(defaults.k);
      setSoilPh(defaults.ph);
    }
  }, [farmToEdit, user, isOpen]);

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
  }, [soilN, soilP, soilK, soilPh, latitude, longitude, token]);

  // Debounced auto-fetch whenever soil parameters change
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchCropRecommendation();
    }, 600);
    return () => clearTimeout(timer);
  }, [soilN, soilP, soilK, soilPh, isOpen, fetchCropRecommendation]);

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
      area: Number(area),
      boundary: boundary || undefined,
      latitude: Number(latitude),
      longitude: Number(longitude),
      soil_type: soilType,
      soil_health_card: hasSoilHealthCard,
      soil_n: Number(soilN),
      soil_p: Number(soilP),
      soil_k: Number(soilK),
      soil_ph: Number(soilPh),
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
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  id="farm-area-input"
                  value={area}
                  onChange={(e) => {
                    setArea(parseFloat(e.target.value) || 0.1);
                    setIsAutoArea(false);
                  }}
                  className="w-full h-11 px-3.5 rounded-xl border border-stone-300 bg-[#FBFBF9] text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                />
              </div>
            </div>

            {/* Farm Boundary Drawer (GIS Polygon on Leaflet Map) */}
            <FarmBoundaryDrawer
              initialBoundary={farmToEdit?.boundary}
              initialCenter={{ lat: latitude, lng: longitude }}
              onBoundaryChange={handleBoundaryChange}
            />

            {/* GPS & Soil Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              /* PATH B: Farmer does not have card -> Show 6 large soil category cards */
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-800">
                      {t('soil_cat_picker_title')}
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {t('soil_est_npk_label')} N:{soilN} • P:{soilP} • K:{soilK} • pH:{soilPh}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {t('soil_cat_picker_desc')}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(SOIL_TYPE_BENCHMARKS).map(([key, bench]) => {
                    const isSelected = soilType === key;
                    const IconComponent = bench.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        id={`soil-cat-btn-${key}`}
                        onClick={() => handleSoilTypeSelect(key)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#1E4620] bg-white ring-2 ring-[#1E4620]/20 shadow-xs'
                            : 'border-stone-200 bg-white/70 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <div className={`p-1.5 rounded-lg ${isSelected ? bench.badgeColor : 'bg-stone-100 text-stone-600'}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#1E4620]" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-900 leading-tight">
                            {t(bench.nameKey as any)}
                          </div>
                          <p className="text-[10px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                            {t(bench.descKey as any)}
                          </p>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-600 font-semibold">
                          <span>N:{bench.n} P:{bench.p}</span>
                          <span>K:{bench.k} pH:{bench.ph}</span>
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
                {/* Tooltip */}
                <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block w-64 bg-stone-900 text-white text-[11px] p-2 rounded-xl shadow-lg z-50">
                  {t('data_source_real_tooltip')}
                </div>
              </div>
            </div>

            {loadingAI ? (
              <div className="py-4 text-center text-xs text-stone-500 font-medium flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#1E4620] border-t-transparent rounded-full animate-spin" />
                <span>Analyzing soil chemistry against agricultural benchmarks...</span>
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
