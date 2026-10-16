import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  CloudRain, 
  Droplets, 
  Thermometer, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  Wind, 
  Sun, 
  Cloud, 
  Clock, 
  Calendar,
  Sprout,
  ArrowRight
} from 'lucide-react';

import { FarmerNavbar } from '../components/FarmerNavbar.js';
import { FarmListView } from '../components/FarmListView.js';
import { FarmDetailView } from '../components/FarmDetailView.js';
import { FarmFormModal } from '../components/FarmFormModal.js';
import { AIPredictionsView } from '../components/AIPredictionsView.js';
import { MarketPricesView } from '../components/MarketPricesView.js';
import { useAuth } from '../context/AuthContext.js';


interface DashboardPageProps {
  section?: 'overview' | 'farms' | 'farm-detail' | 'weather' | 'market' | 'ai-predictions';
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const DashboardPage: React.FC<DashboardPageProps> = ({ section = 'overview' }) => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { farmId } = useParams<{ farmId?: string }>();

  const [actionConfirmed, setActionConfirmed] = useState(false);

  // Farms state
  const [farms, setFarms] = useState<any[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [farmToEdit, setFarmToEdit] = useState<any | null>(null);

  // Fetch all farms for the logged-in cultivator
  const fetchFarms = useCallback(async () => {
    if (!token) return;
    setLoadingFarms(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFarms(data.data || []);
      }
    } catch (err) {
      console.error('[DashboardPage] Failed to fetch farms:', err);
    } finally {
      setLoadingFarms(false);
    }
  }, [token]);

  // Health alerts for crops with 2+ consecutive Concerning logs
  const [healthAlerts, setHealthAlerts] = useState<any[]>([]);

  const fetchHealthAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/health-alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHealthAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('[DashboardPage] Failed to fetch health alerts:', err);
    }
  }, [token]);

  // Community Disease Outbreaks alerts (within 10-15 km for matching crops)
  const [communityAlerts, setCommunityAlerts] = useState<any[]>([]);

  const fetchCommunityAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/outbreaks/community-alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCommunityAlerts(data.data || []);
      }
    } catch (err) {
      console.error('[DashboardPage] Failed to fetch community alerts:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchFarms();
      fetchHealthAlerts();
      fetchCommunityAlerts();
    }
  }, [token, fetchFarms, fetchHealthAlerts, fetchCommunityAlerts]);


  // Handle Farm deletion
  const handleDeleteFarm = async (targetId: string) => {
    if (!window.confirm('Are you sure you want to delete this farm?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/${targetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFarms((prev) => prev.filter((f) => f._id !== targetId));
      }
    } catch (err) {
      console.error('Failed to delete farm:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#14251B] flex flex-col font-sans selection:bg-[#2D6A4F] selection:text-white">
      {/* Unified Farmer Navigation */}
      <FarmerNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. OVERVIEW SECTION */}
        {/* ========================================================================= */}
        {section === 'overview' && (
          <div className="space-y-6">
            {/* Top Status Banner */}
            <div className="bg-white border border-[#D8D5C5] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center border border-[#2D6A4F]/20 shadow-2xs">
                  <CheckCircle2 className="w-6 h-6 text-[#2D6A4F]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold bg-[#EBF5EE] text-[#1E4620] px-2 py-0.5 rounded border border-[#2D6A4F]/20 uppercase tracking-wider">
                      {t('badge_active_status')}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <h1 className="text-base sm:text-lg font-bold text-[#14251B] mt-0.5">
                    {t('dash_status_text')}
                  </h1>
                </div>
              </div>

              <div className="text-left sm:text-right bg-[#FBFBF9] px-3.5 py-1.5 rounded-xl border border-stone-200">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{t('dash_farmer_id')}</div>
                <div className="text-sm font-bold text-[#1E4620]">{user?.name || 'Registered Cultivator'}</div>
              </div>
            </div>

            {/* CROP HEALTH ALERT (Triggered when 2+ consecutive "Concerning" logs are recorded) */}
            {healthAlerts.length > 0 && (
              <div className="space-y-3">
                {healthAlerts.map((alert: any) => (
                  <div
                    key={alert.crop_id}
                    id={`overview-crop-health-alert-${alert.crop_id}`}
                    className="bg-[#FFFBEB] text-[#14251B] border-2 border-amber-400 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="p-2.5 bg-amber-200 border border-amber-300 rounded-2xl flex-shrink-0 text-amber-900 shadow-2xs">
                        <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                            {alert.consecutive_concerning_count} {t('health_streak_concerning_badge')}
                          </span>
                          <span className="text-xs text-stone-500 font-semibold">
                            {new Date(alert.last_logged_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#14251B] mt-1">
                          {t('crop_health_alert_banner_title')} — {String(t(`crop_${alert.crop_type}` as any, alert.crop_type))} ({alert.farm_name})
                        </h3>
                        <p className="mt-0.5 text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                          {t('crop_health_alert_banner_desc', {
                            crop: String(t(`crop_${alert.crop_type}` as any, alert.crop_type)),
                            farm: alert.farm_name,
                          })}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/dashboard/farms/${alert.farm_id}`}
                      id={`inspect-alert-crop-btn-${alert.crop_id}`}
                      className="h-10 px-4 rounded-xl bg-[#1E4620] hover:bg-[#163719] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-xs flex-shrink-0 self-start sm:self-auto"
                    >
                      <span>{t('crop_health_alert_inspect_btn')}</span>
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* COMMUNITY DISEASE OUTBREAK ALERT (Triggered by MongoDB $geoNear when disease is nearby for matching crop) */}
            {communityAlerts.length > 0 && (
              <div className="space-y-3">
                {communityAlerts.map((alert: any) => (
                  <div
                    key={alert.farmId}
                    id={`overview-community-outbreak-alert-${alert.farmId}`}
                    className="bg-[#FFF7ED] text-[#14251B] border-2 border-orange-500 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="p-2.5 bg-orange-100 border border-orange-300 rounded-2xl flex-shrink-0 text-orange-700 shadow-2xs">
                        <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wider bg-orange-200 text-orange-950 px-2 py-0.5 rounded">
                            {t('outbreak_community_badge')}
                          </span>
                          {alert.isDemo && (
                            <span 
                              id={`demo-tag-overview-${alert.farmId}`}
                              className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded"
                            >
                              {t('outbreak_demo_tag')}
                            </span>
                          )}
                          <span className="text-xs text-stone-500 font-semibold">
                            {t('outbreak_days_ago', { count: alert.daysAgo })}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#14251B] mt-1">
                          {t('outbreak_banner_headline', {
                            distance: alert.nearestDistanceKm,
                            crop: String(t(`crop_${alert.cropType}` as any, alert.cropType)),
                            farm: alert.farmName,
                          })}
                        </h3>
                        <p className="mt-0.5 text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                          {t('outbreak_concern_label')}: <strong className="text-orange-950">{alert.concern}</strong>. {alert.guidance}
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/dashboard/farms"
                      id={`view-outbreak-on-map-btn-${alert.farmId}`}
                      className="h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-xs flex-shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <span>{t('outbreak_view_on_map_btn')}</span>
                      <ArrowRight className="w-4 h-4 text-orange-200" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* Registered Farm Plots Overview (Direct Data) */}
            <div className="bg-white border border-[#D8D5C5] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1E4620] text-amber-300 flex items-center justify-center shadow-xs flex-shrink-0">
                  <Sprout className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    {t('dash_nav_farms')}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#14251B]">
                    {farms.length > 0 
                      ? `${farms.length} ${farms.length === 1 ? 'Registered Plot' : 'Registered Plots'}`
                      : t('farms_empty_title')}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {farms.length > 0 
                      ? 'Direct field coordinates, soil chemistry profiles, and current crop cycles.'
                      : t('farms_empty_sub')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <Link
                  to="/dashboard/farms"
                  className="h-10 px-4 rounded-xl bg-[#1E4620] hover:bg-[#163719] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-xs"
                >
                  <span>Manage Plots</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </Link>
                <Link
                  to="/dashboard/ai-predictions"
                  className="h-10 px-3.5 rounded-xl bg-[#FBFBF9] hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{t('dash_nav_ai')}</span>
                </Link>
              </div>
            </div>

            {/* ONE CLEAR PRIMARY ACTION */}
            <div className="bg-white border border-[#D8D5C5] rounded-3xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-[#1E4620]">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#14251B]">
                  {t('dash_action_box_title')}
                </h2>
              </div>

              <p className="text-sm sm:text-base text-stone-700 font-medium mb-4">
                {actionConfirmed
                  ? t('dash_rec_irrigation_done')
                  : t('dash_rec_irrigation', { minutes: 35, time: '11:00 AM' })}
              </p>

              <button
                type="button"
                id="dash-primary-action-btn"
                onClick={() => setActionConfirmed(!actionConfirmed)}
                className={`h-11 px-5 rounded-2xl text-sm font-bold border transition-all flex items-center gap-2 shadow-xs ${
                  actionConfirmed
                    ? 'bg-[#EBF5EE] text-[#1E4620] border-[#2D6A4F]/30 hover:bg-[#d8eedf]'
                    : 'bg-[#1E4620] text-white border-[#1E4620] hover:bg-[#163719]'
                }`}
              >
                <Droplets className="w-4 h-4 text-amber-300" />
                <span>
                  {actionConfirmed ? t('dash_rec_btn_done') : t('dash_rec_btn_confirm')}
                </span>
              </button>
            </div>

            {/* KEY METRICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Metric 1: Soil Moisture */}
              <div className="bg-white border border-[#D8D5C5] rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    {t('dash_metric_soil_label')}
                  </span>
                  <span className="text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                    {t('badge_optimal')}
                  </span>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-black text-[#14251B] tracking-tight">
                  {t('dash_metric_soil_val')}
                </div>
                <div className="mt-1 text-xs text-stone-500 font-medium">
                  {t('dash_metric_soil_target')}
                </div>
              </div>

              {/* Metric 2: Field Temperature */}
              <div className="bg-white border border-[#D8D5C5] rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-amber-600" />
                    {t('dash_metric_temp_label')}
                  </span>
                  <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                    {t('badge_clear_sky')}
                  </span>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-black text-[#14251B] tracking-tight">
                  {t('dash_metric_temp_val')}
                </div>
                <div className="mt-1 text-xs text-stone-500 font-medium">
                  {t('dash_metric_temp_details')}
                </div>
              </div>

              {/* Metric 3: Mandi Average */}
              <div className="bg-white border border-[#D8D5C5] rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    {t('dash_metric_mandi_label')}
                  </span>
                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                    {t('badge_trend_up')}
                  </span>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-black text-[#14251B] tracking-tight">
                  {t('dash_metric_mandi_val')}
                </div>
                <div className="mt-1 text-xs text-stone-500 font-medium">
                  {t('dash_metric_mandi_details')}
                </div>
              </div>
            </div>

            {/* Weather Advisory Alert Block */}
            <div className="bg-[#FFFBEB] text-[#14251B] border border-amber-300 rounded-3xl p-4 sm:p-5 shadow-xs flex items-start gap-3.5">
              <div className="p-2 bg-amber-200 border border-amber-300 rounded-xl flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-900" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#14251B] flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-[#1E4620]" />
                  <span>{t('dash_alert_rain_title')}</span>
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                  {t('dash_alert_rain_desc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. FARMS LIST SECTION */}
        {/* ========================================================================= */}
        {section === 'farms' && (
          <FarmListView
            farms={farms}
            loading={loadingFarms}
            onAddNew={() => {
              setFarmToEdit(null);
              setIsModalOpen(true);
            }}
            onSelectFarm={(id) => navigate(`/dashboard/farms/${id}`)}
            onEditFarm={(farm) => {
              setFarmToEdit(farm);
              setIsModalOpen(true);
            }}
            onDeleteFarm={handleDeleteFarm}
            token={token}
          />
        )}

        {/* ========================================================================= */}
        {/* 3. FARM DETAIL & AI INSIGHTS SECTION */}
        {/* ========================================================================= */}
        {section === 'farm-detail' && farmId && (
          <FarmDetailView
            farmId={farmId}
            onBack={() => navigate('/dashboard/farms')}
            onEditFarm={(farm) => {
              setFarmToEdit(farm);
              setIsModalOpen(true);
            }}
            onFarmDeleted={() => {
              fetchFarms();
              navigate('/dashboard/farms');
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 4. WEATHER ADVISORY SECTION */}
        {/* ========================================================================= */}
        {section === 'weather' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#D8D5C5] rounded-3xl p-5 sm:p-6 shadow-xs">
              <h1 className="text-lg sm:text-xl font-bold text-[#14251B]">
                {t('weather_page_title')}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                {t('weather_page_sub')}
              </p>
            </div>

            {/* Spraying Window Advisory */}
            <div className="bg-[#EBF5EE] border border-[#2D6A4F]/20 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center gap-2 text-[#1E4620] mb-2 font-bold text-sm sm:text-base">
                <Clock className="w-4 h-4 text-[#2D6A4F]" />
                <span>{t('weather_spraying_advisory')}</span>
              </div>
              <p className="text-xs sm:text-sm text-[#14251B] leading-relaxed">
                {t('weather_spraying_desc')}
              </p>
            </div>

            {/* 7-Day Forecast Grid */}
            <div className="bg-white border border-[#D8D5C5] rounded-3xl p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm sm:text-base font-bold text-[#14251B] mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1E4620]" />
                <span>{t('weather_forecast_7day')}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Day 1 - Today */}
                <div className="p-4 bg-[#FBFBF9] rounded-2xl border border-stone-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-600">{t('weather_day_today')}</span>
                    <Sun className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="my-2">
                    <div className="text-xl font-bold text-[#14251B]">30°C / 19°C</div>
                    <div className="text-xs text-stone-600 font-medium">{t('weather_condition_clear')}</div>
                  </div>
                  <div className="text-[11px] text-stone-500 flex items-center justify-between pt-2 border-t border-stone-200">
                    <span>{t('weather_rain_chance')}:</span>
                    <span className="font-bold text-[#1E4620]">10%</span>
                  </div>
                </div>

                {/* Day 2 - Tomorrow */}
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">{t('weather_day_tomorrow')}</span>
                    <CloudRain className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="my-2">
                    <div className="text-xl font-bold text-[#14251B]">26°C / 18°C</div>
                    <div className="text-xs text-amber-800 font-bold">{t('weather_condition_rain')}</div>
                  </div>
                  <div className="text-[11px] text-amber-900 flex items-center justify-between pt-2 border-t border-amber-200">
                    <span>{t('weather_rain_chance')}:</span>
                    <span className="font-bold text-sky-700">85%</span>
                  </div>
                </div>

                {/* Day 3 */}
                <div className="p-4 bg-[#FBFBF9] rounded-2xl border border-stone-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-600">{t('weather_day_day3')}</span>
                    <Cloud className="w-5 h-5 text-stone-400" />
                  </div>
                  <div className="my-2">
                    <div className="text-xl font-bold text-[#14251B]">28°C / 17°C</div>
                    <div className="text-xs text-stone-600 font-medium">{t('weather_condition_cloudy')}</div>
                  </div>
                  <div className="text-[11px] text-stone-500 flex items-center justify-between pt-2 border-t border-stone-200">
                    <span>{t('weather_rain_chance')}:</span>
                    <span className="font-bold text-[#1E4620]">25%</span>
                  </div>
                </div>

                {/* Day 4 */}
                <div className="p-4 bg-[#FBFBF9] rounded-2xl border border-stone-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-600">{t('weather_day_day4')}</span>
                    <Sun className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="my-2">
                    <div className="text-xl font-bold text-[#14251B]">31°C / 19°C</div>
                    <div className="text-xs text-stone-600 font-medium">{t('weather_condition_clear')}</div>
                  </div>
                  <div className="text-[11px] text-stone-500 flex items-center justify-between pt-2 border-t border-stone-200">
                    <span>{t('weather_rain_chance')}:</span>
                    <span className="font-bold text-[#1E4620]">5%</span>
                  </div>
                </div>

                {/* Day 5 */}
                <div className="p-4 bg-[#FBFBF9] rounded-2xl border border-stone-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-600">{t('weather_day_day5')}</span>
                    <Sun className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="my-2">
                    <div className="text-xl font-bold text-[#14251B]">32°C / 20°C</div>
                    <div className="text-xs text-stone-600 font-medium">{t('weather_condition_clear')}</div>
                  </div>
                  <div className="text-[11px] text-stone-500 flex items-center justify-between pt-2 border-t border-stone-200">
                    <span>{t('weather_rain_chance')}:</span>
                    <span className="font-bold text-[#1E4620]">0%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Atmospheric Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-[#D8D5C5] rounded-3xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-500 uppercase">{t('weather_humidity_label')}</div>
                  <div className="text-xl font-bold text-[#14251B]">64%</div>
                  <div className="text-xs text-stone-500">{t('badge_optimal')}</div>
                </div>
              </div>

              <div className="bg-white border border-[#D8D5C5] rounded-3xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wind className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-500 uppercase">{t('weather_wind_label')}</div>
                  <div className="text-xl font-bold text-[#14251B]">11 km/h (NNW)</div>
                  <div className="text-xs text-stone-500">{t('badge_optimal')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. MARKET PRICES SECTION */}
        {/* ========================================================================= */}
        {section === 'market' && (
          <MarketPricesView farms={farms} />
        )}


        {/* ========================================================================= */}
        {/* 6. DEDICATED AI PREDICTIONS SECTION */}
        {/* ========================================================================= */}
        {section === 'ai-predictions' && (
          <AIPredictionsView />
        )}

      </main>

      {/* Farm Creation / Edit Modal */}
      <FarmFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFarmToEdit(null);
        }}
        farmToEdit={farmToEdit}
        onSuccess={() => {
          fetchFarms();
        }}
      />
    </div>
  );
};

export default DashboardPage;
