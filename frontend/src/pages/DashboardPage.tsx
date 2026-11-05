import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  CloudRain, 
  Droplets, 
  Wind, 
  Sun, 
  Cloud, 
  Clock, 
  Calendar
} from 'lucide-react';

import { FarmerNavbar } from '../components/FarmerNavbar.js';
import { FarmListView } from '../components/FarmListView.js';
import { FarmDetailView } from '../components/FarmDetailView.js';
import { FarmFormModal } from '../components/FarmFormModal.js';
import { AIPredictionsView } from '../components/AIPredictionsView.js';
import { MarketPricesView } from '../components/MarketPricesView.js';
import { TodayDashboardView } from '../components/TodayDashboardView.js';
import { FirstRunOnboardingModal } from '../components/FirstRunOnboardingModal.js';
import { MobileBottomNav } from '../components/MobileBottomNav.js';
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

  // Farms state
  const [farms, setFarms] = useState<any[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24 md:pb-8">
        
        {/* ========================================================================= */}
        {/* 1. TODAY SECTION (PHASE 6: REPLACING OLD OVERVIEW) */}
        {/* ========================================================================= */}
        {section === 'overview' && (
          <TodayDashboardView
            farms={farms}
            user={user}
            token={token}
            healthAlerts={healthAlerts}
            communityAlerts={communityAlerts}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onRefreshFarms={fetchFarms}
          />
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
                  <div className="text-xl font-bold text-[#14251B]">{farms[0]?.weather?.wind_speed ?? 11} km/h</div>
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

      {/* 3-Step First-Run Onboarding Modal */}
      <FirstRunOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={() => {
          fetchFarms();
        }}
        token={token}
      />

      {/* Mobile Bottom Tab Bar (Max 5 items, min 48px touch targets) */}
      <MobileBottomNav />
    </div>
  );
};

export default DashboardPage;
