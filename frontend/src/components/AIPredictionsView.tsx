import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Sprout, 
  Droplets, 
  MapPin, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  FlaskConical, 
  Plus, 
  Wind,
  Calendar,
  Clock,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { SpeechListenButton } from './SpeechListenButton.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const AIPredictionsView: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [loadingFarms, setLoadingFarms] = useState(true);

  // Model 1: Crop Recommendation State
  const [cropRec, setCropRec] = useState<any | null>(null);
  const [loadingCropRec, setLoadingCropRec] = useState(false);

  // Model 2: Irrigation Advisory State
  const [irrigRec, setIrrigRec] = useState<any | null>(null);
  const [loadingIrrigRec, setLoadingIrrigRec] = useState(false);

  // 1. Fetch user's registered farms
  useEffect(() => {
    const fetchFarms = async () => {
      if (!token) return;
      setLoadingFarms(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/farms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setFarms(data.data);
          if (data.data.length > 0 && !selectedFarmId) {
            setSelectedFarmId(data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('[AIPredictionsView] Error fetching farms:', err);
      } finally {
        setLoadingFarms(false);
      }
    };

    fetchFarms();
  }, [token]);

  // Selected Farm object
  const currentFarm = farms.find((f) => f._id === selectedFarmId) || farms[0] || null;

  // 2. Fetch Predictions whenever selected farm changes
  const fetchPredictionsForFarm = useCallback(async (farm: any) => {
    if (!token || !farm) return;

    // --- Fetch Model 1: Crop Recommendation ---
    setLoadingCropRec(true);
    try {
      const cropRes = await fetch(`${API_BASE_URL}/api/farms/recommend-crop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          soil_n: farm.soil_n ?? 90,
          soil_p: farm.soil_p ?? 42,
          soil_k: farm.soil_k ?? 43,
          soil_ph: farm.soil_ph ?? 6.5,
          latitude: farm.latitude,
          longitude: farm.longitude,
        }),
      });
      const cropData = await cropRes.json();
      if (cropRes.ok && cropData.success) {
        setCropRec(cropData);
      } else {
        setCropRec({ available: false, messageKey: 'ai_crop_unavailable' });
      }
    } catch (err) {
      console.warn('[AIPredictionsView] Crop model error:', err);
      setCropRec({ available: false, messageKey: 'ai_crop_unavailable' });
    } finally {
      setLoadingCropRec(false);
    }

    // --- Fetch Model 2: Irrigation Advisory ---
    setLoadingIrrigRec(true);
    try {
      const irrigRes = await fetch(`${API_BASE_URL}/api/recommendations/${farm._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const irrigData = await irrigRes.json();
      if (irrigRes.ok && irrigData.success) {
        setIrrigRec(irrigData);
      } else {
        setIrrigRec({ available: false, messageKey: 'ai_insights_unavailable' });
      }
    } catch (err) {
      console.warn('[AIPredictionsView] Irrigation model error:', err);
      setIrrigRec({ available: false, messageKey: 'ai_insights_unavailable' });
    } finally {
      setLoadingIrrigRec(false);
    }
  }, [token]);

  useEffect(() => {
    if (currentFarm) {
      fetchPredictionsForFarm(currentFarm);
    }
  }, [currentFarm, fetchPredictionsForFarm]);

  if (loadingFarms) {
    return (
      <div className="bg-white border border-[#D8D5C5] rounded-3xl p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-3 shadow-xs">
        <div className="w-8 h-8 border-3 border-[#1E4620] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading farm plots & intelligence engines...</span>
      </div>
    );
  }

  // Empty State: No farms registered yet
  if (!farms || farms.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-[#D8D5C5] rounded-3xl p-6 shadow-xs">
          <h1 className="text-xl sm:text-2xl font-black text-[#14251B] tracking-tight">
            {t('ai_page_title')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
            {t('ai_page_sub')}
          </p>
        </div>

        <div className="bg-white border-2 border-dashed border-[#D8D5C5] rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#14251B]">
              {t('ai_no_farms_title')}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {t('ai_no_farms_sub')}
            </p>
          </div>
          <Link
            to="/dashboard/farms"
            id="register-farm-from-ai-btn"
            className="h-11 px-6 rounded-2xl bg-[#1E4620] hover:bg-[#163719] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>{t('btn_add_farm')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="bg-white border border-[#D8D5C5] rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#1E4620] mb-1">
            <Sparkles className="w-5 h-5 text-amber-500 stroke-[2.2]" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Machine Learning Intelligence Hub
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#14251B] tracking-tight">
            {t('ai_page_title')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
            {t('ai_page_sub')}
          </p>
        </div>

        <Link
          to="/dashboard/farms"
          className="h-10 px-4 rounded-xl bg-[#FBFBF9] hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-2xs"
        >
          <Sprout className="w-4 h-4 text-[#2D6A4F]" />
          <span>{t('dash_nav_farms')}</span>
        </Link>
      </div>

      {/* Farm Switcher: Top-level selector for multiple farms */}
      <div className="bg-white border border-[#D8D5C5] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-[#1E4620]" />
            <span>{t('ai_select_farm')}</span>
          </span>
          {currentFarm && (
            <div className="text-xs text-stone-500 font-medium flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>{currentFarm.latitude.toFixed(2)}°N, {currentFarm.longitude.toFixed(2)}°E</span>
              <span>•</span>
              <span className="font-semibold text-stone-700 capitalize">
                {String(t(`farm_soil_${currentFarm.soil_type}` as any, currentFarm.soil_type))}
              </span>
            </div>
          )}
        </div>

        {/* Tab-like Farm Selector Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist">
          {farms.map((farm) => {
            const isSelected = farm._id === selectedFarmId;
            return (
              <button
                key={farm._id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                id={`farm-switcher-${farm._id}`}
                onClick={() => setSelectedFarmId(farm._id)}
                className={`h-11 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all flex-shrink-0 border ${
                  isSelected
                    ? 'bg-[#1E4620] text-white border-[#1E4620] shadow-xs'
                    : 'bg-[#FBFBF9] hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-stone-400'}`} />
                <span className="truncate max-w-[160px] sm:max-w-[200px]">{farm.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
                }`}>
                  {farm.area} {t('crop_acres')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Farm Quick Chemical Summary */}
      {currentFarm && (
        <div className="bg-[#FBFBF9] border border-stone-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-stone-700">
            <FlaskConical className="w-4 h-4 text-[#1E4620]" />
            <span>Plot Soil Chemistry:</span>
          </div>
          <div className="flex items-center gap-4 text-stone-600 font-medium">
            <span>N: <strong className="text-stone-800">{currentFarm.soil_n ?? 90}</strong> kg/ha</span>
            <span>P: <strong className="text-stone-800">{currentFarm.soil_p ?? 42}</strong> kg/ha</span>
            <span>K: <strong className="text-stone-800">{currentFarm.soil_k ?? 43}</strong> kg/ha</span>
            <span>pH: <strong className="text-[#1E4620]">{currentFarm.soil_ph ?? 6.5}</strong></span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TWO CLEARLY SEPARATED SECTIONS FOR THE SELECTED FARM */}
      {/* ========================================================================= */}
      <div className="space-y-6">

        {/* --------------------------------------------------------------------- */}
        {/* SECTION 1: CROP RECOMMENDATION (MODEL 1: REAL ICAR DATASET) */}
        {/* --------------------------------------------------------------------- */}
        <section 
          id="ai-crop-recommendation-section"
          className="bg-white border-2 border-emerald-700/25 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-50 rounded-bl-full pointer-events-none -z-0" />

          <div className="relative z-10 space-y-5">
            {/* Header with Title and Model 1 Data Source Label */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center font-bold">
                  <Sprout className="w-5 h-5 text-[#2D6A4F]" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#14251B] tracking-tight">
                    {t('ai_crop_heading')}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {t('ai_crop_rec_sub')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cropRec && cropRec.available && cropRec.recommended_crop && (
                  <SpeechListenButton
                    id="btn-listen-crop-rec"
                    textToSpeak={`${t('ai_crop_rec_title')}: ${cropRec.recommended_crop}. ${cropRec.confidence || 'High'} confidence. ${cropRec.sowing_advisory?.sowing_note || ''} ${cropRec.sowing_advisory?.land_preparation_guidance || ''}`}
                  />
                )}

                {/* Data Source Badge: Real Agricultural Data (ICAR India) */}
                <div className="group relative flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold cursor-help shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('data_source_real_badge')}</span>
                  <Info className="w-3.5 h-3.5 text-emerald-700" />
                  {/* Tooltip */}
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-72 bg-stone-900 text-white text-[11px] p-2.5 rounded-xl shadow-lg z-50 leading-relaxed">
                    {t('ai_model1_source_note')}
                  </div>
                </div>
              </div>
            </div>

            {loadingCropRec ? (
              <div className="py-8 text-center text-xs text-stone-500 font-medium flex items-center justify-center gap-2.5">
                <div className="w-5 h-5 border-2 border-[#1E4620] border-t-transparent rounded-full animate-spin" />
                <span>Querying 2,200 ICAR agricultural benchmarks...</span>
              </div>
            ) : cropRec && cropRec.available && cropRec.recommended_crop ? (
              <div className="space-y-5 pt-2">
                {/* Recommended Crop Card - LARGEST ELEMENT MANDATE */}
                <div className="bg-[#FBFBF9] border border-stone-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      {t('ai_crop_rec_title')}
                    </div>
                    {/* LARGEST ELEMENT: Icon + Recommended Crop Name */}
                    <div 
                      id="ai-crop-recommended-name"
                      className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E4620] capitalize tracking-tight flex items-center gap-3.5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center font-bold flex-shrink-0">
                        <Sprout className="w-7 h-7 text-[#2D6A4F]" />
                      </div>
                      <span>{String(t(`crop_${cropRec.recommended_crop}` as any, cropRec.recommended_crop))}</span>
                    </div>
                  </div>

                  {/* Confidence Shown As Plain Text */}
                  <div className="flex flex-col items-start sm:items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {t('ai_crop_confidence')}
                    </span>
                    <div 
                      id="ai-crop-confidence-text"
                      className="text-base sm:text-lg font-bold text-stone-800"
                    >
                      {cropRec.confidence || 'High'} ({Math.round((cropRec.confidence_score || 0.95) * 100)}%)
                    </div>
                    <span className="text-[11px] text-stone-500 font-medium">
                      Soil Suitability Match
                    </span>
                  </div>
                </div>

                {/* The 2 Alternative Crop Suggestions Shown Smaller Below */}
                {cropRec.alternatives && cropRec.alternatives.length > 0 && (
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-600">
                      {t('ai_crop_alternatives')} (Secondary Choices):
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {cropRec.alternatives.map((alt: string) => (
                        <div
                          key={alt}
                          className="h-10 px-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 font-bold text-xs sm:text-sm flex items-center gap-2 capitalize shadow-2xs"
                        >
                          <Sprout className="w-4 h-4 text-stone-500" />
                          <span>{String(t(`crop_${alt}` as any, alt))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sowing Window & Land Preparation Advisory (Module 6) */}
                {cropRec.sowing_advisory && (
                  <div 
                    id="ai-crop-sowing-advisory"
                    className={`rounded-2xl p-5 border transition-all ${
                      cropRec.sowing_advisory.sowing_status === 'in_season'
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : cropRec.sowing_advisory.sowing_status === 'approaching_sowing'
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-rose-50/60 border-rose-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                          cropRec.sowing_advisory.sowing_status === 'in_season'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cropRec.sowing_advisory.sowing_status === 'approaching_sowing'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                            {t('sowing_window_label')}
                          </span>
                          <div className="text-sm sm:text-base font-black text-stone-800 flex items-center gap-2">
                            <span>{cropRec.sowing_advisory.sowing_window}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-700">
                              {String(t(cropRec.sowing_advisory.seasonKey as any, cropRec.sowing_advisory.season))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sowing Status Badge */}
                      <div>
                        {cropRec.sowing_advisory.sowing_status === 'in_season' && (
                          <span 
                            id="sowing-status-badge-in-season"
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{t('sowing_status_in_season')}</span>
                          </span>
                        )}
                        {cropRec.sowing_advisory.sowing_status === 'approaching_sowing' && (
                          <span 
                            id="sowing-status-badge-approaching"
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full shadow-2xs"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-800" />
                            <span>{t('sowing_status_approaching')}</span>
                          </span>
                        )}
                        {cropRec.sowing_advisory.sowing_status === 'outside_window' && (
                          <span 
                            id="sowing-status-badge-out-of-season"
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 px-3 py-1 rounded-full shadow-2xs"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                            <span>{t('sowing_status_out_of_season')}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Explanatory Sowing Window Guidance */}
                    <div className="pt-3 space-y-2.5">
                      <p id="sowing-advisory-note" className="text-xs sm:text-sm font-medium text-stone-700 leading-relaxed">
                        {cropRec.sowing_advisory.sowing_status === 'outside_window'
                          ? t('sowing_out_of_season_note', {
                              window: cropRec.sowing_advisory.sowing_window,
                              season: String(t(cropRec.sowing_advisory.seasonKey as any, cropRec.sowing_advisory.season)),
                            })
                          : cropRec.sowing_advisory.sowing_status === 'approaching_sowing'
                          ? t('sowing_approaching_note', {
                              window: cropRec.sowing_advisory.sowing_window,
                              season: String(t(cropRec.sowing_advisory.seasonKey as any, cropRec.sowing_advisory.season)),
                            })
                          : t('sowing_in_season_note')}
                      </p>

                      {/* Land Preparation Guidance (Part 3) */}
                      <div className="bg-white/80 border border-stone-200/80 rounded-xl p-3 flex items-start gap-2.5">
                        <div className="p-1.5 bg-stone-100 rounded-lg text-stone-700 flex-shrink-0 mt-0.5">
                          <Wind className="w-4 h-4 text-emerald-800" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-stone-800">
                              {t('land_prep_title')}
                            </span>
                            {cropRec.sowing_advisory.land_prep_active && (
                              <span id="land-prep-recommended-badge" className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {t('land_prep_recommended_badge')}
                              </span>
                            )}
                            <span className="text-[11px] text-stone-500 font-medium">
                              • {cropRec.sowing_advisory.typical_days_to_harvest} {t('typical_harvest_days')}
                            </span>
                          </div>
                          <p id="land-prep-guidance-text" className="text-xs text-stone-600 leading-relaxed font-normal">
                            {cropRec.sowing_advisory.land_preparation_guidance || t('land_prep_note')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Short Explanatory Note */}
                <p className="text-xs text-stone-500 flex items-center gap-1.5 font-medium">
                  <Info className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span>{t('ai_model1_source_note')}</span>
                </p>
              </div>
            ) : (
              <div className="bg-stone-50 border border-stone-300 rounded-2xl p-5 text-stone-700 flex items-center gap-2.5 text-xs sm:text-sm">
                <HelpCircle className="w-5 h-5 text-stone-400 flex-shrink-0" />
                <span>{t('ai_crop_unavailable')}</span>
              </div>
            )}
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* SECTION 2: IRRIGATION ADVISORY (MODEL 2: SYNTHETIC DOMAIN BOOTSTRAP) */}
        {/* --------------------------------------------------------------------- */}
        <section 
          id="ai-irrigation-advisory-section"
          className="bg-white border-2 border-[#1E4620]/30 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-amber-50/70 rounded-bl-full pointer-events-none -z-0" />

          <div className="relative z-10 space-y-5">
            {/* Header with Title and Model 2 Data Source Label */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                  <Droplets className="w-5 h-5 text-[#2D6A4F]" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#14251B] tracking-tight">
                    {t('ai_irrigation_heading')}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {t('ai_insights_sub')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {irrigRec && irrigRec.available && (
                  <SpeechListenButton
                    id="btn-listen-irrig-rec"
                    textToSpeak={`${t('ai_action_heading')}: ${irrigRec.recommended_action}. ${t('ai_urgency_label')}: ${irrigRec.urgency_level}. ${irrigRec.top_reasons?.[0]?.description || ''}`}
                  />
                )}

                {/* Data Source Badge: Domain-Informed Adaptive Model */}
                <div className="group relative flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold cursor-help shadow-2xs">
                  <Info className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t('data_source_synthetic_badge')}</span>
                  {/* Tooltip */}
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-72 bg-stone-900 text-white text-[11px] p-2.5 rounded-xl shadow-lg z-50 leading-relaxed">
                    {t('ai_model2_source_note')}
                  </div>
                </div>
              </div>
            </div>

            {loadingIrrigRec ? (
              <div className="py-8 text-center text-xs text-stone-500 font-medium flex items-center justify-center gap-2.5">
                <div className="w-5 h-5 border-2 border-[#1E4620] border-t-transparent rounded-full animate-spin" />
                <span>Analyzing field weather, dry periods, and percolation physics...</span>
              </div>
            ) : irrigRec && irrigRec.available ? (
              <div className="space-y-5 pt-2">
                {/* Recommended Action Card - LARGEST ELEMENT MANDATE */}
                <div className="bg-[#FBFBF9] border border-stone-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      {t('ai_action_heading')}
                    </div>
                    {/* LARGEST ELEMENT: Icon + Recommended Action */}
                    <div 
                      id="ai-irrigation-recommended-action"
                      className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E4620] tracking-tight flex items-center gap-3.5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center font-bold flex-shrink-0">
                        <Droplets className="w-7 h-7 text-[#2D6A4F]" />
                      </div>
                      <span>{String(t(irrigRec.messageKey as any, irrigRec.recommended_action))}</span>
                    </div>
                  </div>

                  {/* Urgency Level As Color + Icon Badge & Plain Text Confidence */}
                  <div className="flex flex-col items-start sm:items-end gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {t('ai_urgency_label')}
                    </span>
                    <div
                      id="ai-irrigation-urgency-badge"
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 border ${
                        irrigRec.urgency_level === 'High'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : irrigRec.urgency_level === 'Medium'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      <span>{String(t(`ai_urgency_${irrigRec.urgency_level?.toLowerCase()}` as any, `${irrigRec.urgency_level} Priority`))}</span>
                    </div>

                    {/* Confidence as Plain Text */}
                    <div 
                      id="ai-irrigation-confidence-text"
                      className="text-xs sm:text-sm font-bold text-stone-700 mt-1"
                    >
                      {t('ai_crop_confidence')}: {irrigRec.confidence} ({Math.round((irrigRec.confidence_score || 0.9) * 100)}%)
                    </div>
                  </div>
                </div>

                {/* Top Reasons As Short Bullet Points With Relevant Icons */}
                {irrigRec.top_reasons && irrigRec.top_reasons.length > 0 && (
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{t('ai_reasons_title')}</span>
                    </div>
                    <ul className="space-y-2">
                      {irrigRec.top_reasons.map((reason: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-xs sm:text-sm text-stone-700 font-medium bg-[#FBFBF9] p-3 rounded-xl border border-stone-200"
                        >
                          <div className="w-6 h-6 rounded-lg bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx === 0 ? <Droplets className="w-3.5 h-3.5 text-[#2D6A4F]" /> : <Wind className="w-3.5 h-3.5 text-stone-600" />}
                          </div>
                          <span className="leading-snug">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Short Explanatory Note on Continuous Learning */}
                <p className="text-xs text-stone-500 flex items-center gap-1.5 font-medium">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{t('ai_model2_source_note')}</span>
                </p>
              </div>
            ) : (
              <div 
                id="ai-insights-unavailable-box"
                className="bg-stone-50 border border-stone-300 rounded-2xl p-5 text-stone-700 space-y-2"
              >
                <div className="flex items-center gap-2 text-stone-700 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>AI Insights Notice</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-600">
                  {t('ai_insights_unavailable')}
                </p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default AIPredictionsView;
