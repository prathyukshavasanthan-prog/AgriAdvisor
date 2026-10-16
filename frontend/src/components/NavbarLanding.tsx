import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, ArrowRight, LayoutDashboard } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector.js';
import { useAuth } from '../context/AuthContext.js';

export const NavbarLanding: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#F9F8F3]/90 backdrop-blur-md border-b border-[#E7E5D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Logo + Name */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group focus:outline-none focus:ring-2 focus:ring-[#1E4620] rounded-lg p-1 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1E4620] text-amber-300 flex items-center justify-center shadow-md shadow-[#1E4620]/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <Sprout className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#14251B] font-sans truncate">
              {t('brand_name')}
            </span>
            <span className="hidden sm:block text-xs font-medium text-[#4D6553] tracking-wide truncate">
              {t('brand_subtitle')}
            </span>
          </div>
        </Link>

        {/* Center: Horizontal menu links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-semibold text-[#2D3A30] hover:text-[#1E4620] transition-colors py-1"
          >
            {t('nav_features')}
          </a>
          <a
            href="#capabilities"
            className="text-sm font-semibold text-[#2D3A30] hover:text-[#1E4620] transition-colors py-1"
          >
            {t('nav_capabilities')}
          </a>
          <a
            href="#mission"
            className="text-sm font-semibold text-[#2D3A30] hover:text-[#1E4620] transition-colors py-1"
          >
            {t('nav_editorial')}
          </a>
        </nav>

        {/* Right: Language Switcher, Login and Sign Up buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <LanguageSelector variant="landing" />

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              id="landing-dashboard-btn"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#1E4620] hover:bg-[#153417] shadow-sm hover:shadow transition-all whitespace-nowrap"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('nav_dashboard')}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/login"
                id="landing-login-btn"
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#1E4620] hover:text-[#14251B] hover:bg-[#EBF5EE] rounded-xl transition-colors whitespace-nowrap"
              >
                {t('nav_login')}
              </Link>
              <Link
                to="/register"
                id="landing-register-btn"
                className="inline-flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-[#1E4620] hover:bg-[#163719] rounded-xl shadow-xs transition-all whitespace-nowrap group"
              >
                <span>{t('nav_register')}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform hidden sm:inline" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
