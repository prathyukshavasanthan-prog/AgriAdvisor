import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  CloudSun, 
  TrendingUp, 
  User, 
  LogOut, 
  Sprout, 
  Sparkles,
  CheckCircle2,
  Mic
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector.js';
import { FarmerProfileModal } from './FarmerProfileModal.js';
import { VoiceAssistantModal } from './VoiceAssistantModal.js';
import { useAuth } from '../context/AuthContext.js';

export const FarmerNavbar: React.FC = () => {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Determine active tab from pathname
  const currentPath = location.pathname;
  let activeTab = 'overview';
  if (currentPath.includes('/ai-predictions')) {
    activeTab = 'ai-predictions';
  } else if (currentPath.includes('/farms')) {
    activeTab = 'farms';
  } else if (currentPath.includes('/weather')) {
    activeTab = 'weather';
  } else if (currentPath.includes('/market')) {
    activeTab = 'market';
  }

  // Exact Requested Nav Order: Overview, Weather Advisory, Market Prices, My Farms, AI Predictions
  const navTabs = [
    { id: 'overview', label: t('dash_nav_overview'), path: '/dashboard', icon: Home },
    { id: 'weather', label: t('dash_nav_weather'), path: '/dashboard/weather', icon: CloudSun },
    { id: 'market', label: t('dash_nav_market'), path: '/dashboard/market', icon: TrendingUp },
    { id: 'farms', label: t('dash_nav_farms'), path: '/dashboard/farms', icon: Sprout },
    { id: 'ai-predictions', label: t('dash_nav_ai'), path: '/dashboard/ai-predictions', icon: Sparkles },
  ];

  return (
    <>
      <header className="bg-white border-b border-[#E7E5D8] sticky top-0 z-40 shadow-xs">
        {/* Top Header: Brand + Status + Profile Avatar & Logout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 border-b border-stone-100">
          {/* Brand Logo & Name */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E4620] rounded-xl p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1E4620] text-amber-300 flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#14251B] tracking-tight flex items-center gap-2">
                <span>{t('brand_name')}</span>
                <span className="text-[10px] font-bold text-[#1E4620] bg-[#EBF5EE] border border-[#2D6A4F]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {t('badge_active_status')}
                </span>
              </div>
              <div className="text-xs text-stone-500 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span className="truncate max-w-[180px] sm:max-w-xs">{user?.name ? user.name : t('dash_farmer_id')}</span>
              </div>
            </div>
          </Link>

          {/* Right Controls: Voice Assistant, Language Selector, Farmer Avatar (Profile), and Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Voice Assistant Button (Part 2c) */}
            <button
              type="button"
              id="farmer-voice-assistant-btn"
              onClick={() => setIsVoiceOpen(true)}
              aria-label={t('voice_assistant_title', 'Voice Assistant')}
              className="h-10 px-2.5 sm:px-3 bg-[#EBF5EE] hover:bg-[#D5EAD9] text-[#1E4620] font-semibold text-xs sm:text-sm border border-[#2D6A4F]/30 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title={t('voice_assistant_title', 'Voice Assistant')}
            >
              <Mic className="w-4 h-4 text-[#2D6A4F]" />
              <span className="hidden lg:inline font-bold">{t('voice_assistant_title', 'Voice Assistant')}</span>
            </button>

            <LanguageSelector variant="landing" />

            {/* Profile Avatar Button next to Logout (Part 5 Mandate) */}
            <button
              type="button"
              id="farmer-profile-avatar-btn"
              onClick={() => setIsProfileOpen(true)}
              aria-label={t('dash_nav_profile')}
              className="h-10 px-3 bg-stone-100 hover:bg-stone-200 text-[#14251B] font-semibold text-xs sm:text-sm border border-stone-300 rounded-xl flex items-center gap-2 transition-all hover:border-[#1E4620] focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
            >
              <div className="w-6 h-6 rounded-full bg-[#1E4620] text-amber-300 flex items-center justify-center text-xs font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <span className="hidden md:inline font-bold">{t('dash_nav_profile')}</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              id="dash-logout-btn"
              onClick={handleLogout}
              aria-label={t('nav_logout')}
              className="h-10 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm border border-rose-200 rounded-xl flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav_logout')}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation: Exactly 3 Tabs (Overview, Weather Advisory, Market Prices) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 sm:gap-4 py-2 overflow-x-auto" aria-label="Farmer Sub-navigation">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  id={`farmer-tab-${tab.id}`}
                  className={`h-11 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-[#1E4620] text-white border-[#1E4620] shadow-sm'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:text-[#1E4620]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-[#2D6A4F]'}`} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Farmer Profile Modal (Header Avatar Triggered) */}
      <FarmerProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Voice Assistant Modal (Part 2c) */}
      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </>
  );
};
