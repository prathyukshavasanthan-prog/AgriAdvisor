import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Sprout, 
  Droplets, 
  Leaf, 
  Map, 
  AlertTriangle, 
  TrendingUp, 
  Languages, 
  FlaskConical, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  KeyRound, 
  Sparkles
} from 'lucide-react';
import { NavbarLanding } from '../components/NavbarLanding.js';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#14251B] flex flex-col font-sans selection:bg-[#2D6A4F] selection:text-white">
      {/* Top Navigation */}
      <NavbarLanding />

      <main className="flex-1">
        {/* HERO SECTION — Simple, Focused, Deeply Related to Project */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16 max-w-7xl mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#1E4620] via-[#173a19] to-[#0f2711] text-white p-6 sm:p-12 lg:p-14 overflow-hidden shadow-xl border border-[#2D6A4F]/30">
            {/* Subtle background decorative shapes */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
              {/* Project Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-amber-300 border border-white/15 text-xs sm:text-sm font-semibold backdrop-blur-sm shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t('hero_badge')}</span>
                <span className="text-white/40">•</span>
                <span className="text-emerald-200">Level 3 System</span>
              </div>

              {/* Bold 2-Line Project Title */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                <span className="block text-emerald-300 drop-shadow-sm">{t('hero_headline_1')}</span>
                <span className="block text-white drop-shadow-sm mt-1">{t('hero_headline_2')}</span>
              </h1>

              {/* Clear, Project-Specific Subtext */}
              <p className="text-base sm:text-lg text-stone-200 max-w-3xl mx-auto font-normal leading-relaxed">
                {t('hero_subtext')}
              </p>

              {/* Pre-Seeded Live Demo Access Callout */}
              <div className="max-w-xl mx-auto bg-black/30 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 text-left text-xs sm:text-sm shadow-inner">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10 text-amber-300 font-bold">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Live Demo Evaluator Credentials:</span>
                  </div>
                  <span className="bg-amber-400/20 text-amber-200 text-[11px] px-2 py-0.5 rounded-full font-mono font-bold">
                    PRE-SEEDED
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 font-mono text-stone-200">
                  <div>
                    <span className="text-stone-400 text-xs">Phone:</span> <strong className="text-white">+919876543210</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-xs">Password:</span> <strong className="text-white">password123</strong>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-emerald-200/80 font-sans">
                  Includes 3 active farms (Bangalore, Indore, Jalandhar) + health history + community disease outbreak alerts.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
                <Link
                  to="/login"
                  id="hero-get-started-btn"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-bold text-[#14251B] bg-amber-400 hover:bg-amber-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all group"
                >
                  <span>{t('hero_cta_start')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/register"
                  id="hero-register-btn"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-sm transition-all"
                >
                  <span>{t('nav_register')}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 6 CORE ENGINEERING MODULES (Deeply Related to Project, No Generic Stock Photos) */}
        <section id="capabilities" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2D6A4F] bg-[#EBF5EE] px-3.5 py-1.5 rounded-full border border-[#2D6A4F]/20">
              {t('grid_badge')}
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#14251B] tracking-tight">
              {t('grid_heading')}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#394D40]">
              {t('grid_subheading')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1: AI Crop Recommendation Engine */}
            <div className="bg-white rounded-2xl border border-[#E7E5D8] p-6 shadow-sm hover:shadow-md hover:border-[#1E4620]/30 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#1E4620] flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-[#1E4620]" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                    Random Forest (99.55%)
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#14251B]">
                  {t('card_crop_title')}
                </h3>
                <p className="text-xs sm:text-sm text-[#4D6553] leading-relaxed">
                  Trained on authentic ICAR agricultural soil data (2,200 samples, 22 crops). Maps soil N-P-K, pH, temperature, and rainfall to optimal staple and cash crops.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>Dataset: Authentic Agricultural</span>
                <span className="text-emerald-700 font-bold">Model 1</span>
              </div>
            </div>

            {/* Module 2: Precision Irrigation Advisory */}
            <div className="bg-white rounded-2xl border border-[#E7E5D8] p-6 shadow-sm hover:shadow-md hover:border-[#1E4620]/30 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-sky-700" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                    FAO-56 Soil Physics
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#14251B]">
                  {t('card_irrigation_title')}
                </h3>
                <p className="text-xs sm:text-sm text-[#4D6553] leading-relaxed">
                  Calculates watering urgency by combining soil percolation capacity, dry period intervals, and forward 24-hour Open-Meteo precipitation forecasts.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>Model: Synthetic Bootstrap</span>
                <span className="text-sky-700 font-bold">Model 2</span>
              </div>
            </div>

            {/* Module 3: Foliar Disease Diagnostic Classifier */}
            <div className="bg-white rounded-2xl border border-[#E7E5D8] p-6 shadow-sm hover:shadow-md hover:border-[#1E4620]/30 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-amber-700" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                    MobileNetV2 (98.15%)
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#14251B]">
                  Crop Foliar Disease Diagnosis
                </h3>
                <p className="text-xs sm:text-sm text-[#4D6553] leading-relaxed">
                  Deep learning transfer model trained on PlantVillage benchmark. Diagnoses early blight, late blight, and rust from phone photos with safe cultural guidance.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>Low-confidence Fallback Guard</span>
                <span className="text-amber-700 font-bold">Model 3</span>
              </div>
            </div>

            {/* Module 4: Soil Health Card & ICAR Benchmarks */}
            <div className="bg-white rounded-2xl border border-[#E7E5D8] p-6 shadow-sm hover:shadow-md hover:border-[#1E4620]/30 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-[#1E4620]" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-300 font-mono">
                    Govt. SHC Dual-Path
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#14251B]">
                  Soil Health Card Integration
                </h3>
                <p className="text-xs sm:text-sm text-[#4D6553] leading-relaxed">
                  Dual-path workflow: cultivators can enter laboratory Soil Health Card numbers directly or select their regional soil category with ICAR benchmark defaults.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>6 Indian Soil Textures</span>
                <span className="text-[#1E4620] font-bold">Module 4</span>
              </div>
            </div>

            {/* Module 5: Leaflet GIS & Polygon Boundary Drawer */}
            <div className="bg-white rounded-2xl border border-[#E7E5D8] p-6 shadow-sm hover:shadow-md hover:border-[#1E4620]/30 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                    <Map className="w-5 h-5 text-purple-700" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-mono">
                    Leaflet + Turf.js
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#14251B]">
                  {t('card_gis_title')}
                </h3>
                <p className="text-xs sm:text-sm text-[#4D6553] leading-relaxed">
                  Interactive OpenStreetMap & Esri satellite basemaps. Tap vertices to draw plot boundaries, auto-calculate acreage, and view dual-channel status pins.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>Zero Paid API Key Billing</span>
                <span className="text-purple-700 font-bold">Module 5</span>
              </div>
            </div>

            {/* Module 6: Geospatial Community Outbreak Alerts */}
            <div className="bg-white rounded-2xl border border-[#E7E5D8] p-6 shadow-sm hover:shadow-md hover:border-[#1E4620]/30 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-rose-700" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-mono">
                    MongoDB $geoNear 10km
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#14251B]">
                  Community Disease Surveillance
                </h3>
                <p className="text-xs sm:text-sm text-[#4D6553] leading-relaxed">
                  Automatically flags neighboring outbreaks for matching crops using 2dsphere indexes, with a ~500m geodesic offset to strictly preserve farmer privacy.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>Privacy-Preserving Geodesic</span>
                <span className="text-rose-700 font-bold">Extension</span>
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEM HIGHLIGHTS: APMC Mandis, 10 Languages & Microservices */}
        <section id="features" className="py-12 bg-white border-y border-[#E7E5D8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-[#F9F8F3] border border-[#E7E5D8] space-y-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-700" />
                </div>
                <h4 className="text-base font-bold text-[#14251B]">
                  {t('card_market_title')}
                </h4>
                <p className="text-xs sm:text-sm text-[#445B4B] leading-relaxed">
                  14-day APMC mandi price history across major commodities with Haversine distances to 11 authentic markets and +10% seller guidance notifications.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-[#F9F8F3] border border-[#E7E5D8] space-y-3">
                <div className="w-9 h-9 rounded-xl bg-[#1E4620]/10 text-[#1E4620] flex items-center justify-center">
                  <Languages className="w-5 h-5 text-[#1E4620]" />
                </div>
                <h4 className="text-base font-bold text-[#14251B]">
                  {t('card_multilingual_title')}
                </h4>
                <p className="text-xs sm:text-sm text-[#445B4B] leading-relaxed">
                  100% key parity (470 keys) across 10 Indian scripts (`ta`, `en`, `hi`, `te`, `kn`, `ml`, `mr`, `bn`, `gu`, `pa`) with Web Speech audio narration.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-[#F9F8F3] border border-[#E7E5D8] space-y-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-800 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-emerald-800" />
                </div>
                <h4 className="text-base font-bold text-[#14251B]">
                  Decoupled Microservice Architecture
                </h4>
                <p className="text-xs sm:text-sm text-[#445B4B] leading-relaxed">
                  Production stack: React/Vite (5273), Express/Node.js (5900), FastAPI ML microservice (8000), MongoDB with 2dsphere indexes, and Redis cache.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION & ENGINEERING INTEGRITY BLOCK */}
        <section id="mission" className="py-14 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2D6A4F] bg-white px-4 py-1.5 rounded-full border border-[#D8D5C5] shadow-2xs">
            {t('editorial_badge')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14251B] leading-tight">
            {t('editorial_heading')}
          </h2>
          <div className="space-y-3 text-sm sm:text-base text-[#314636] leading-relaxed max-w-2xl mx-auto">
            <p>{t('editorial_p1')}</p>
            <p>{t('editorial_p2')}</p>
          </div>
          <div className="pt-4 flex items-center justify-center gap-3 text-xs sm:text-sm font-bold text-[#1E4620]">
            <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
            <span>{t('editorial_quote')}</span>
          </div>
        </section>

        {/* DIRECT DEMO CTA */}
        <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-[#1E4620] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {t('closing_heading')}
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 max-w-xl mx-auto">
              Launch the 5-minute evaluation walkthrough or inspect the pre-seeded demo farms right away.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-emerald-100 pt-2">
              <span className="bg-emerald-800/80 px-3.5 py-1.5 rounded-full border border-emerald-600/40">
                ✓ {t('closing_chip_1')}
              </span>
              <span className="bg-emerald-800/80 px-3.5 py-1.5 rounded-full border border-emerald-600/40">
                ✓ 3 AI/ML Models
              </span>
              <span className="bg-emerald-800/80 px-3.5 py-1.5 rounded-full border border-emerald-600/40">
                ✓ GIS Polygon Boundaries
              </span>
            </div>

            <div className="pt-4">
              <Link
                to="/login"
                id="closing-get-started-btn"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold text-[#14251B] bg-amber-400 hover:bg-amber-300 shadow-md hover:shadow-lg transition-all"
              >
                <span>{t('closing_cta')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#E7E5D8] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[#445B4B]">
          <div>
            © {new Date().getFullYear()} {t('brand_name')}. {t('footer_rights')}
          </div>
          <div className="flex items-center gap-6">
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
