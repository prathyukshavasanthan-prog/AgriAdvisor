import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Droplets, 
  Check, 
  HelpCircle, 
  Sparkles, 
  Camera, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Plus,
  ArrowRight,
  HeartPulse,
  Info,
  X
} from 'lucide-react';
import { SpeechListenButton } from './SpeechListenButton.js';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

interface TodayDashboardViewProps {
  farms: any[];
  user: any;
  token?: string | null;
  healthAlerts: any[];
  communityAlerts: any[];
  onOpenOnboarding: () => void;
  onRefreshFarms: () => void;
}

export const TodayDashboardView: React.FC<TodayDashboardViewProps> = ({
  farms,
  user,
  token,
  healthAlerts,
  communityAlerts,
  onOpenOnboarding,
  onRefreshFarms
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Selected farm (defaults to first farm)
  const currentFarm = farms && farms.length > 0 ? farms[0] : null;

  // Tile 1: Irrigation Done state
  const [irrigationDone, setIrrigationDone] = useState(false);
  const [irrigationSubmitting, setIrrigationSubmitting] = useState(false);

  // Tile 2: Crop Health Done state
  const [cropHealthDone, setCropHealthDone] = useState(false);
  const [cropHealthStatus, setCropHealthStatus] = useState<'Healthy' | 'Concerning'>('Healthy');
  const [healthSubmitting, setHealthSubmitting] = useState(false);

  // "Why?" Modal State
  const [activeWhy, setActiveWhy] = useState<{ title: string; text: string } | null>(null);

  // "More" Toggle State
  const [showMore, setShowMore] = useState(false);

  // Action 1: "I watered today" handler
  const handleToggleWatered = async () => {
    if (!currentFarm || !token) return;
    const nextState = !irrigationDone;
    setIrrigationDone(nextState);

    if (nextState) {
      setIrrigationSubmitting(true);
      try {
        await fetch(`${API_BASE_URL}/api/farms/${currentFarm._id}/watered-today`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ amount_mm: 12, notes: 'Today quick check' })
        });
      } catch (err) {
        console.error('Failed to log irrigation:', err);
      } finally {
        setIrrigationSubmitting(false);
        onRefreshFarms?.();
      }
    }
  };

  // Action 2: "Crop looks fine / not fine" handler
  const handleToggleCropHealth = async (status: 'Healthy' | 'Concerning') => {
    if (!currentFarm || !token) return;
    setCropHealthDone(true);
    setCropHealthStatus(status);
    setHealthSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/api/farms/${currentFarm._id}/crop-health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          notes: status === 'Healthy' ? 'Daily check fine' : 'Leaves showing distress'
        })
      });
    } catch (err) {
      console.error('Failed to log health check:', err);
    } finally {
      setHealthSubmitting(false);
      onRefreshFarms?.();
    }
  };

  // Action 3: "Take leaf photo" handler
  const handleTakeLeafPhoto = () => {
    if (currentFarm) {
      navigate(`/dashboard/farms/${currentFarm._id}#leaf-diagnosis`);
    } else {
      onOpenOnboarding();
    }
  };

  // Empty State: No farms registered yet
  if (!farms || farms.length === 0) {
    return (
      <div 
        id="today-empty-state"
        className="bg-white border-2 border-[#1E4620]/20 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm"
      >
        <div className="w-16 h-16 rounded-3xl bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center mx-auto shadow-xs">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-[#14251B] tracking-tight">
            Welcome to AgriAdvisor
          </h2>
          <p className="text-sm text-stone-600 font-medium">
            Setup your first plot in 30 seconds to receive daily irrigation advice.
          </p>
        </div>
        <button
          type="button"
          id="btn-today-start-onboarding"
          onClick={onOpenOnboarding}
          className="h-12 px-6 rounded-2xl bg-[#1E4620] hover:bg-[#163719] text-white font-bold text-sm flex items-center justify-center gap-2 mx-auto shadow-md transition cursor-pointer min-h-[48px] min-w-[48px]"
        >
          <Plus className="w-5 h-5 text-amber-300" />
          <span>{t('onboard_title', 'Quick Farm Setup')}</span>
        </button>
      </div>
    );
  }

  const farmerName = user?.name ? user.name.split(' ')[0] : 'Farmer';

  return (
    <div id="today-view-container" className="space-y-6 max-w-4xl mx-auto">
      {/* ========================================================================= */}
      {/* ONE BIG CARD: TODAY */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-[#1E4620]/25 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        
        {/* Card Header: Greeting, Date, Listen Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#14251B] tracking-tight mt-0.5">
              {t('today_greeting', { name: farmerName })}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <SpeechListenButton
              id="btn-listen-today-briefing"
              textToSpeak={`${t('today_title', "Today's Farm Actions")}. ${irrigationDone ? t('tile_irrigate_done_title', 'Plot watered for today') : t('tile_irrigate_title', 'Water plot for 35 min today')}. ${t('tile_health_title', 'Daily crop health check: all good')}.`}
            />
            {currentFarm && (
              <span className="text-xs font-bold bg-[#EBF5EE] text-[#1E4620] px-3 py-1.5 rounded-xl border border-[#2D6A4F]/20 truncate max-w-[130px]">
                🌾 {currentFarm.name}
              </span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* AT MOST 3 ACTION TILES */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 gap-3.5" id="today-action-tiles-grid">

          {/* TILE 1: IRRIGATION ACTION */}
          <div
            id="today-tile-irrigation"
            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[48px] ${
              irrigationDone
                ? 'bg-[#EBF5EE]/70 border-[#2D6A4F]/30'
                : 'bg-[#FBFBF9] border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                irrigationDone ? 'bg-[#1E4620] text-white' : 'bg-sky-100 text-sky-800'
              }`}>
                <Droplets className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    irrigationDone ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {irrigationDone ? 'Done' : 'High Priority'}
                  </span>
                  <SpeechListenButton
                    id="btn-listen-tile-irrigation"
                    textToSpeak={irrigationDone ? t('tile_irrigate_done_title', 'Plot watered for today') : t('tile_irrigate_title', 'Water plot for 35 min today')}
                  />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#14251B] leading-snug">
                  {irrigationDone
                    ? t('tile_irrigate_done_title', 'Plot watered for today')
                    : t('tile_irrigate_title', 'Water plot for 35 min today')}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <button
                type="button"
                id="btn-why-irrigation"
                onClick={() => setActiveWhy({
                  title: t('tile_irrigate_title', 'Water plot for 35 min today'),
                  text: t('tile_irrigate_why', 'Soil water depletion is high. No rain forecast in next 48 hours.')
                })}
                className="h-10 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer min-h-[48px]"
              >
                <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
                <span>{t('btn_why', 'Why?')}</span>
              </button>

              <button
                type="button"
                id="btn-done-irrigation"
                onClick={handleToggleWatered}
                disabled={irrigationSubmitting}
                className={`h-10 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer min-h-[48px] ${
                  irrigationDone
                    ? 'bg-[#1E4620] text-white shadow-xs'
                    : 'bg-white border-2 border-stone-300 hover:border-[#1E4620] text-stone-700'
                }`}
              >
                <Check className={`w-4 h-4 ${irrigationDone ? 'text-amber-300' : 'text-stone-400'}`} />
                <span>{irrigationDone ? t('btn_done', 'Done') : t('quick_watered', 'I Watered Today')}</span>
              </button>
            </div>
          </div>

          {/* TILE 2: CROP HEALTH CHECK-IN */}
          <div
            id="today-tile-health"
            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[48px] ${
              cropHealthDone
                ? 'bg-[#EBF5EE]/70 border-[#2D6A4F]/30'
                : 'bg-[#FBFBF9] border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                cropHealthDone ? 'bg-[#1E4620] text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                <HeartPulse className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    cropHealthDone ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-800'
                  }`}>
                    {cropHealthDone ? 'Checked' : 'Daily Task'}
                  </span>
                  <SpeechListenButton
                    id="btn-listen-tile-health"
                    textToSpeak={cropHealthDone ? t('tile_health_done_title', 'Crop health logged as healthy') : t('tile_health_title', 'Daily crop health check: all good')}
                  />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#14251B] leading-snug">
                  {cropHealthDone
                    ? t('tile_health_done_title', 'Crop health logged as healthy')
                    : t('tile_health_title', 'Daily crop health check: all good')}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <button
                type="button"
                id="btn-why-health"
                onClick={() => setActiveWhy({
                  title: t('tile_health_title', 'Daily crop health check: all good'),
                  text: t('tile_health_why', 'Regular check-ins catch leaf infections and pests before they spread.')
                })}
                className="h-10 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer min-h-[48px]"
              >
                <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
                <span>{t('btn_why', 'Why?')}</span>
              </button>

              <button
                type="button"
                id="btn-done-health-fine"
                onClick={() => handleToggleCropHealth('Healthy')}
                disabled={healthSubmitting}
                className={`h-10 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer min-h-[48px] ${
                  cropHealthDone && cropHealthStatus === 'Healthy'
                    ? 'bg-[#1E4620] text-white shadow-xs'
                    : 'bg-white border border-stone-300 hover:border-emerald-600 text-stone-700'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${cropHealthDone && cropHealthStatus === 'Healthy' ? 'text-amber-300' : 'text-emerald-600'}`} />
                <span>{t('quick_crop_fine', 'Crop Looks Fine')}</span>
              </button>
            </div>
          </div>

          {/* TILE 3: LEAF PHOTO CHECK */}
          <div
            id="today-tile-photo"
            className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-[#FBFBF9] hover:border-stone-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[48px]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Camera className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                    AI Ready
                  </span>
                  <SpeechListenButton
                    id="btn-listen-tile-photo"
                    textToSpeak={t('tile_photo_title', 'Check crop leaf for early disease')}
                  />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#14251B] leading-snug">
                  {t('tile_photo_title', 'Check crop leaf for early disease')}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <button
                type="button"
                id="btn-why-photo"
                onClick={() => setActiveWhy({
                  title: t('tile_photo_title', 'Check crop leaf for early disease'),
                  text: t('tile_photo_why', 'MobileNetV2 neural network scans leaf spots and blights instantly.')
                })}
                className="h-10 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer min-h-[48px]"
              >
                <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
                <span>{t('btn_why', 'Why?')}</span>
              </button>

              <button
                type="button"
                id="btn-take-leaf-photo"
                onClick={handleTakeLeafPhoto}
                className="h-10 px-4 rounded-xl bg-[#1E4620] hover:bg-[#163719] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer min-h-[48px] shadow-xs"
              >
                <Camera className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('quick_take_photo', 'Take Leaf Photo')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ONE-TAP QUICK BAR (Desktop/Tablet shortcut, mobile uses direct tile buttons) */}
        <div className="pt-2 hidden sm:flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Quick Actions:
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="quick-action-watered"
              onClick={handleToggleWatered}
              className="px-3 py-1.5 rounded-xl bg-[#EBF5EE] hover:bg-[#d8eedf] text-[#1E4620] border border-[#2D6A4F]/20 text-xs font-bold flex items-center gap-1.5 min-h-[40px] transition cursor-pointer"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>{t('quick_watered', 'I Watered Today')}</span>
            </button>
            <button
              type="button"
              id="quick-action-fine"
              onClick={() => handleToggleCropHealth('Healthy')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 min-h-[40px] transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t('quick_crop_fine', 'Crop Looks Fine')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* "MORE" ACCORDION: HIDDEN BY DEFAULT (KEEPS ABOVE-FOLD WORDS <= 60) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <button
          type="button"
          id="btn-toggle-more"
          onClick={() => setShowMore(!showMore)}
          className="w-full py-3 px-4 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 text-stone-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer min-h-[48px] shadow-2xs"
        >
          <span>{showMore ? t('btn_hide_details', 'Hide Details') : t('btn_more_details', 'More Details')}</span>
          {showMore ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
        </button>

        {showMore && (
          <div id="today-more-content" className="space-y-4 animate-in fade-in duration-200">
            {/* Quick Micro-Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-stone-200 rounded-2xl p-3.5 text-center shadow-xs">
                <div className="text-[10px] font-bold text-stone-500 uppercase">{t('weather_moisture', 'Moisture')}</div>
                <div className="text-lg sm:text-xl font-black text-[#1E4620] mt-0.5">38%</div>
                <div className="text-[10px] text-emerald-700 font-bold">{t('badge_optimal', 'Optimal')}</div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-3.5 text-center shadow-xs">
                <div className="text-[10px] font-bold text-stone-500 uppercase">{t('weather_temp', 'Temp')}</div>
                <div className="text-lg sm:text-xl font-black text-[#14251B] mt-0.5">
                  {currentFarm?.weather?.temperature ? `${currentFarm.weather.temperature}°C` : '29°C'}
                </div>
                <div className="text-[10px] text-amber-700 font-bold">{t('badge_clear_sky', 'Sunny')}</div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-3.5 text-center shadow-xs">
                <div className="text-[10px] font-bold text-stone-500 uppercase">{t('market_rate_label', 'Mandi')}</div>
                <div className="text-lg sm:text-xl font-black text-[#14251B] mt-0.5">₹2,450</div>
                <div className="text-[10px] text-emerald-700 font-bold">{t('badge_stable', 'Stable')}</div>
              </div>
            </div>

            {/* Health Alerts If Any */}
            {healthAlerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
                  <div className="text-xs font-bold text-amber-900">
                    {healthAlerts.length} crop check-ins need your attention.
                  </div>
                </div>
                <Link
                  to={`/dashboard/farms/${healthAlerts[0]?.farm_id}`}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs"
                >
                  Review
                </Link>
              </div>
            )}

            {/* Community Outbreaks If Any */}
            {communityAlerts.length > 0 && (
              <div className="bg-orange-50 border border-orange-300 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-700 flex-shrink-0" />
                  <div className="text-xs font-bold text-orange-950">
                    Disease reported {communityAlerts[0]?.nearestDistanceKm} km away.
                  </div>
                </div>
                <Link
                  to="/dashboard/farms?view=map"
                  className="px-3 py-1.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
                >
                  View Map
                </Link>
              </div>
            )}

            {/* Plot Management Link */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#14251B]">
                  {farms.length} Registered {farms.length === 1 ? 'Plot' : 'Plots'}
                </div>
                <div className="text-[11px] text-stone-500">
                  Manage coordinates, crops, and soil profiles.
                </div>
              </div>
              <Link
                to="/dashboard/farms"
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1"
              >
                <span>{t('nav_farms', 'Manage')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* "WHY?" MODAL (EXPLAINS REASON IN <= 12 WORDS) */}
      {/* ========================================================================= */}
      {activeWhy && (
        <div
          id="modal-why-explanation"
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-stone-200 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2 text-[#1E4620] font-black text-sm">
                <Info className="w-4 h-4" />
                <span>{t('btn_why', 'Why?')}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveWhy(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-stone-500">{activeWhy.title}</div>
              <p className="text-sm font-semibold text-stone-800 leading-relaxed">
                {activeWhy.text}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveWhy(null)}
              className="w-full py-2.5 rounded-xl bg-[#1E4620] text-white text-xs font-bold min-h-[44px]"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
