import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Sprout, 
  Droplets, 
  Leaf, 
  Map, 
  Languages, 
  Cpu, 
  ArrowRight, 
  KeyRound, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { NavbarLanding } from '../components/NavbarLanding.js';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden flex flex-col justify-between bg-[#FBFBF9] text-[#14251B] font-sans selection:bg-[#2D6A4F] selection:text-white">
      {/* Top Navigation */}
      <NavbarLanding />

      {/* Main Single-Screen Viewport Content (No-Scroll Portal) */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center w-full">
          
          {/* Left Column (7 cols): Hero Intelligence + Demo Evaluator Quick Access */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            {/* Project Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#EBF5EE] text-[#1E4620] border border-[#2D6A4F]/20 text-[11px] sm:text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>{t('hero_badge')}</span>
              <span className="text-stone-300">•</span>
              <span className="text-emerald-800">Level 3 System</span>
            </div>

            {/* Title & Tagline */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-3xl lg:text-[38px] font-black tracking-tight text-[#14251B] leading-tight">
                <span className="block text-[#1E4620]">{t('hero_headline_1')}</span>
                <span className="block text-stone-800">{t('hero_headline_2')}</span>
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-[#4D6553] font-normal leading-relaxed max-w-2xl pt-1">
                {t('hero_subtext')}
              </p>
            </div>

            {/* Evaluator Live Demo Quick Access Box */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-[#DCD9CB] shadow-sm space-y-2.5">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#1E4620]">
                  <KeyRound className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Live Demo Evaluator Credentials:</span>
                </div>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  PRE-SEEDED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-[#FBFBF9] px-3 py-1.5 rounded-xl border border-stone-200/80">
                  <span className="text-stone-400 font-sans text-[11px] block">Mobile Number:</span>
                  <strong className="text-stone-800 text-sm">+919876543210</strong>
                </div>
                <div className="bg-[#FBFBF9] px-3 py-1.5 rounded-xl border border-stone-200/80">
                  <span className="text-stone-400 font-sans text-[11px] block">Demo Password:</span>
                  <strong className="text-stone-800 text-sm">password123</strong>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 font-medium leading-tight">
                Includes 3 pre-seeded plots (Bangalore Optimal, Indore Warning, Jalandhar Critical) with health history & community disease alerts.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <Link
                to="/login"
                id="hero-get-started-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm sm:text-base font-bold text-[#14251B] bg-amber-400 hover:bg-amber-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all group"
              >
                <span>{t('hero_cta_start')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/register"
                id="hero-register-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm sm:text-base font-semibold text-[#1E4620] bg-white hover:bg-stone-50 border border-[#DCD9CB] shadow-2xs transition-all"
              >
                <span>{t('nav_register')}</span>
              </Link>
            </div>

            {/* Microservices Spec Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-stone-500 font-medium">
              <span className="inline-flex items-center gap-1 bg-[#F5F4EE] px-2.5 py-1 rounded-lg border border-stone-200/60">
                <Cpu className="w-3 h-3 text-[#1E4620]" />
                <span>FastAPI ML (Port 8000)</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-[#F5F4EE] px-2.5 py-1 rounded-lg border border-stone-200/60">
                <span>Express API (Port 5900)</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-[#F5F4EE] px-2.5 py-1 rounded-lg border border-stone-200/60">
                <span>MongoDB 2dsphere ($geoNear)</span>
              </span>
            </div>
          </div>

          {/* Right Column (5 cols): The 4 Project Pillars (2x2 Compact Grid) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Pillar 1: AI Crop Recommendation */}
              <div className="bg-white rounded-2xl border border-[#E7E5D8] p-3.5 sm:p-4 shadow-2xs hover:shadow-sm hover:border-[#1E4620]/40 transition-all flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1E4620] flex items-center justify-center">
                    <Sprout className="w-4 h-4 text-[#1E4620]" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                    99.55% Acc
                  </span>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#14251B]">
                    {t('card_crop_title')}
                  </h3>
                  <p className="text-[11px] text-[#4D6553] leading-snug mt-1">
                    Random Forest on 2,200 ICAR samples mapping N-P-K & pH to optimal crops.
                  </p>
                </div>
                <div className="text-[10px] text-stone-400 font-mono pt-1 border-t border-stone-100">
                  Model 1 • Real Dataset
                </div>
              </div>

              {/* Pillar 2: Precision Irrigation Advisory */}
              <div className="bg-white rounded-2xl border border-[#E7E5D8] p-3.5 sm:p-4 shadow-2xs hover:shadow-sm hover:border-[#1E4620]/40 transition-all flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-sky-700" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                    FAO-56 Physics
                  </span>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#14251B]">
                    {t('card_irrigation_title')}
                  </h3>
                  <p className="text-[11px] text-[#4D6553] leading-snug mt-1">
                    Soil-water balance combined with 24-hour Open-Meteo rain forecasts.
                  </p>
                </div>
                <div className="text-[10px] text-stone-400 font-mono pt-1 border-t border-stone-100">
                  Model 2 • Synthetic Bootstrap
                </div>
              </div>

              {/* Pillar 3: Foliar Disease Classifier */}
              <div className="bg-white rounded-2xl border border-[#E7E5D8] p-3.5 sm:p-4 shadow-2xs hover:shadow-sm hover:border-[#1E4620]/40 transition-all flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-amber-700" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                    98.15% Test
                  </span>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#14251B]">
                    Foliar Disease AI
                  </h3>
                  <p className="text-[11px] text-[#4D6553] leading-snug mt-1">
                    MobileNetV2 neural network for leaf blight with safe cultural guidance.
                  </p>
                </div>
                <div className="text-[10px] text-stone-400 font-mono pt-1 border-t border-stone-100">
                  Model 3 • PlantVillage
                </div>
              </div>

              {/* Pillar 4: GIS Boundaries & Community Alerts */}
              <div className="bg-white rounded-2xl border border-[#E7E5D8] p-3.5 sm:p-4 shadow-2xs hover:shadow-sm hover:border-[#1E4620]/40 transition-all flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                    <Map className="w-4 h-4 text-purple-700" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-mono">
                    $geoNear 10km
                  </span>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#14251B]">
                    GIS & Community Alerts
                  </h3>
                  <p className="text-[11px] text-[#4D6553] leading-snug mt-1">
                    Leaflet polygon drawing + Turf.js acreage & ~500m privacy outbreak alerts.
                  </p>
                </div>
                <div className="text-[10px] text-stone-400 font-mono pt-1 border-t border-stone-100">
                  Module 5 & Extension
                </div>
              </div>

            </div>

            {/* Bottom Accessibility Banner (10 Languages & Web Speech TTS) */}
            <div className="bg-[#EBF5EE] border border-[#2D6A4F]/25 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-[#1E4620]">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-[#1E4620] flex-shrink-0" />
                <span className="font-bold">10 Indian Regional Languages</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Web Speech TTS</span>
              </div>
            </div>
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
