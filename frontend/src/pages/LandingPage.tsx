import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight, 
  KeyRound, 
  Sparkles
} from 'lucide-react';
import { NavbarLanding } from '../components/NavbarLanding.js';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBFBF9] text-[#14251B] font-sans selection:bg-[#2D6A4F] selection:text-white">
      {/* Top Navigation */}
      <NavbarLanding />

      {/* Main Single-Screen Viewport Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-5 sm:py-8 max-w-5xl mx-auto w-full">
        <div className="max-w-3xl mx-auto w-full flex flex-col items-center text-center space-y-4 sm:space-y-6">
          
          {/* Project Status Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF5EE] text-[#1E4620] border border-[#2D6A4F]/20 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>{t('hero_badge')}</span>
          </div>

          {/* Title & Tagline */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-[#14251B] leading-tight">
              <span className="block text-[#1E4620]">{t('hero_headline_1')}</span>
              <span className="block text-stone-800 mt-1">{t('hero_headline_2')}</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-[#4D6553] font-normal leading-relaxed max-w-2xl mx-auto pt-1">
              {t('hero_subtext')}
            </p>
          </div>

          {/* Evaluator Live Demo Quick Access Box */}
          <div className="w-full max-w-xl bg-white rounded-2xl p-4 sm:p-5 border border-[#DCD9CB] shadow-sm space-y-3 text-left">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#1E4620]">
                <KeyRound className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{t('demo_evaluator_title', 'Live Demo Evaluator Credentials:')}</span>
              </div>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                {t('demo_preseeded_badge', 'PRE-SEEDED')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="bg-[#FBFBF9] px-3.5 py-2 rounded-xl border border-stone-200/80">
                <span className="text-stone-400 font-sans text-[11px] block">{t('phone_number_label', 'Mobile Number:')}</span>
                <strong className="text-stone-800 text-sm">+919876543210</strong>
              </div>
              <div className="bg-[#FBFBF9] px-3.5 py-2 rounded-xl border border-stone-200/80">
                <span className="text-stone-400 font-sans text-[11px] block">{t('demo_password_label', 'Demo Password:')}</span>
                <strong className="text-stone-800 text-sm">password123</strong>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 font-medium leading-tight">
              {t('demo_plots_description')}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto pt-1">
            <Link
              to="/login"
              id="hero-get-started-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm sm:text-base font-bold text-[#14251B] bg-amber-400 hover:bg-amber-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            >
              <span>{t('hero_cta_start')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/register"
              id="hero-register-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm sm:text-base font-semibold text-[#1E4620] bg-white hover:bg-stone-50 border border-[#DCD9CB] shadow-2xs transition-all"
            >
              <span>{t('nav_register')}</span>
            </Link>
          </div>

        </div>
      </main>

      {/* Slim Non-Scrolling Footer */}
      <footer className="bg-white border-t border-[#E7E5D8] py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#445B4B]">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} {t('brand_name')}.</span>
            <span className="text-stone-300">•</span>
            <span>{t('footer_rights')}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:text-[#1E4620] cursor-pointer">{t('footer_privacy')}</span>
            <span className="hover:text-[#1E4620] cursor-pointer">{t('footer_terms')}</span>
            <span className="hover:text-[#1E4620] cursor-pointer">{t('footer_contact')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
