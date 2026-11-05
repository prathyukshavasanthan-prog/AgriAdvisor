import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Sprout, MapPin, Sparkles, TrendingUp } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    {
      id: 'today',
      label: t('nav_bottom_today', 'Today'),
      path: '/dashboard/overview',
      icon: Calendar,
      isActive: currentPath === '/dashboard' || currentPath.includes('/overview')
    },
    {
      id: 'farms',
      label: t('nav_bottom_farms', 'Farms'),
      path: '/dashboard/farms',
      icon: Sprout,
      isActive: currentPath.includes('/farms') && !location.search.includes('view=map')
    },
    {
      id: 'map',
      label: t('nav_bottom_map', 'Map'),
      path: '/dashboard/farms?view=map',
      icon: MapPin,
      isActive: currentPath.includes('/farms') && location.search.includes('view=map')
    },
    {
      id: 'ai',
      label: t('nav_bottom_ai', 'AI Advice'),
      path: '/dashboard/ai-predictions',
      icon: Sparkles,
      isActive: currentPath.includes('/ai-predictions')
    },
    {
      id: 'market',
      label: t('nav_bottom_market', 'Market'),
      path: '/dashboard/market',
      icon: TrendingUp,
      isActive: currentPath.includes('/market')
    }
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F9F8F3]/95 backdrop-blur-md border-t border-[#E7E5D8] px-2 py-1 shadow-lg"
    >
      <div className="grid grid-cols-5 gap-1 max-w-md mx-auto items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              id={`mobile-tab-${tab.id}`}
              className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] rounded-2xl transition-all duration-200 select-none ${
                tab.isActive
                  ? 'text-[#1E4620] bg-[#EBF5EE] font-black'
                  : 'text-stone-500 hover:text-stone-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${tab.isActive ? 'stroke-[2.5] text-[#1E4620]' : 'stroke-[1.8]'}`} />
                {tab.isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#1E4620]" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[62px]">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
