import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  CloudRain, 
  Leaf, 
  Droplets, 
  TrendingUp, 
  Map, 
  Languages, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { NavbarLanding } from '../components/NavbarLanding.js';

// Safe image fallback helper
const handleImageFallback = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackUrl: string) => {
  const target = e.target as HTMLImageElement;
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
};

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  const fallbackFarmland = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80";

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#14251B] flex flex-col font-sans selection:bg-[#2D6A4F] selection:text-white">
      {/* Top Navigation */}
      <NavbarLanding />

      <main className="flex-1">
        {/* HERO SECTION (Part 7: Headline & Subtext Directly ON TOP of Farmland Background) */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28 max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#D8D5C5] min-h-[560px] sm:min-h-[620px] flex items-center justify-center">
            {/* Background Farmland Image */}
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=85"
              alt={t('hero_img_alt')}
              onError={(e) => handleImageFallback(e, fallbackFarmland)}
              className="absolute inset-0 w-full h-full object-cover object-center transform scale-105"
              loading="eager"
            />

            {/* Gradient Overlay for Crisp Text Contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#14251B]/85 via-[#14251B]/75 to-[#14251B]/95" />

            {/* Hero Content Sits Directly ON TOP of the Farmland Image */}
            <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 py-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-amber-300 backdrop-blur-md text-xs sm:text-sm font-semibold mb-6 border border-white/20 shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t('hero_badge')}</span>
              </div>

              {/* Bold 2-Line Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15] sm:leading-[1.12]">
                <span className="block text-emerald-300 drop-shadow-sm">{t('hero_headline_1')}</span>
                <span className="block mt-2 text-white drop-shadow-sm">{t('hero_headline_2')}</span>
              </h1>

              {/* Subtext */}
              <p className="mt-6 text-base sm:text-xl text-stone-200 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow">
                {t('hero_subtext')}
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  id="hero-get-started-btn"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl text-base sm:text-lg font-bold text-[#14251B] bg-amber-400 hover:bg-amber-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all group"
                >
                  <span>{t('hero_cta_start')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#capabilities"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-sm transition-all"
                >
                  <span>{t('hero_cta_secondary')}</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* STATS ROW: 4 Stat Blocks */}
        <section id="features" className="py-12 bg-white border-y border-[#E7E5D8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {/* Stat 1 */}
              <div className="p-6 rounded-2xl bg-[#F9F8F3] border border-[#E7E5D8] text-center hover:border-[#1E4620]/30 transition-colors">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E4620] tracking-tight">
                  {t('stat_farmers_count')}
                </div>
                <div className="mt-2 text-sm sm:text-base font-semibold text-[#445B4B]">
                  {t('stat_farmers_label')}
                </div>
              </div>

              {/* Stat 2 */}
              <div className="p-6 rounded-2xl bg-[#F9F8F3] border border-[#E7E5D8] text-center hover:border-[#1E4620]/30 transition-colors">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E4620] tracking-tight">
                  {t('stat_accuracy_count')}
                </div>
                <div className="mt-2 text-sm sm:text-base font-semibold text-[#445B4B]">
                  {t('stat_accuracy_label')}
                </div>
              </div>

              {/* Stat 3 */}
              <div className="p-6 rounded-2xl bg-[#F9F8F3] border border-[#E7E5D8] text-center hover:border-[#1E4620]/30 transition-colors">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E4620] tracking-tight">
                  {t('stat_water_count')}
                </div>
                <div className="mt-2 text-sm sm:text-base font-semibold text-[#445B4B]">
                  {t('stat_water_label')}
                </div>
              </div>

              {/* Stat 4 */}
              <div className="p-6 rounded-2xl bg-[#F9F8F3] border border-[#E7E5D8] text-center hover:border-[#1E4620]/30 transition-colors">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E4620] tracking-tight">
                  {t('stat_yield_count')}
                </div>
                <div className="mt-2 text-sm sm:text-base font-semibold text-[#445B4B]">
                  {t('stat_yield_label')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT GRID SECTION: Capability Cards */}
        <section id="capabilities" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2D6A4F] bg-[#EBF5EE] px-3.5 py-1.5 rounded-full border border-[#2D6A4F]/20">
              {t('grid_badge')}
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#14251B] tracking-tight">
              {t('grid_heading')}
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[#394D40]">
              {t('grid_subheading')}
            </p>
          </div>

          {/* 3-Column Responsive Grid with Reliable Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1: Weather Insights */}
            <div className="bg-white rounded-2xl border border-[#E7E5D8] overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="aspect-[16/10] overflow-hidden bg-stone-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80"
                  alt="Weather Insights"
                  onError={(e) => handleImageFallback(e, fallbackFarmland)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#1E4620] text-white p-2 rounded-xl shadow">
                  <CloudRain className="w-5 h-5 text-amber-300" />
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#14251B]">
                    {t('card_weather_title')}
                  </h3>
                  <p className="mt-2 text-sm text-[#4D6553] leading-relaxed">
                    {t('card_weather_desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: AI Crop Monitoring */}
            <div className="bg-white rounded-2xl border border-[#E7E5D8] overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="aspect-[16/10] overflow-hidden bg-stone-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1592417817098-8f3d69104a49?auto=format&fit=crop&w=800&q=80"
                  alt="AI Crop Monitoring"
                  onError={(e) => handleImageFallback(e, fallbackFarmland)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#1E4620] text-white p-2 rounded-xl shadow">
                  <Leaf className="w-5 h-5 text-emerald-300" />
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#14251B]">
                    {t('card_crop_title')}
                  </h3>
                  <p className="mt-2 text-sm text-[#4D6553] leading-relaxed">
                    {t('card_crop_desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Precision Irrigation */}
            <div className="bg-white rounded-2xl border border-[#E7E5D8] overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="aspect-[16/10] overflow-hidden bg-stone-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=800&q=80"
                  alt="Precision Irrigation"
                  onError={(e) => handleImageFallback(e, fallbackFarmland)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#1E4620] text-white p-2 rounded-xl shadow">
                  <Droplets className="w-5 h-5 text-sky-300" />
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#14251B]">
                    {t('card_irrigation_title')}
                  </h3>
                  <p className="mt-2 text-sm text-[#4D6553] leading-relaxed">
                    {t('card_irrigation_desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4: Live APMC Market Trends */}
            <div className="bg-white rounded-2xl border border-[#E7E5D8] overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="aspect-[16/10] overflow-hidden bg-stone-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80"
                  alt="Live Mandi Trends"
                  onError={(e) => handleImageFallback(e, fallbackFarmland)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#1E4620] text-white p-2 rounded-xl shadow">
                  <TrendingUp className="w-5 h-5 text-amber-300" />
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#14251B]">
                    {t('card_market_title')}
                  </h3>
                  <p className="mt-2 text-sm text-[#4D6553] leading-relaxed">
                    {t('card_market_desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 5: GIS Satellite Mapping */}
            <div className="bg-white rounded-2xl border border-[#E7E5D8] overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="aspect-[16/10] overflow-hidden bg-stone-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80"
                  alt="GIS Satellite Mapping"
                  onError={(e) => handleImageFallback(e, fallbackFarmland)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#1E4620] text-white p-2 rounded-xl shadow">
                  <Map className="w-5 h-5 text-emerald-300" />
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#14251B]">
                    {t('card_gis_title')}
                  </h3>
                  <p className="mt-2 text-sm text-[#4D6553] leading-relaxed">
                    {t('card_gis_desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 6: Native Multilingual First */}
            <div className="bg-white rounded-2xl border border-[#E7E5D8] overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="aspect-[16/10] overflow-hidden bg-stone-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80"
                  alt="10 Indian Languages"
                  onError={(e) => handleImageFallback(e, fallbackFarmland)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#1E4620] text-white p-2 rounded-xl shadow">
                  <Languages className="w-5 h-5 text-amber-300" />
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#14251B]">
                    {t('card_multilingual_title')}
                  </h3>
                  <p className="mt-2 text-sm text-[#4D6553] leading-relaxed">
                    {t('card_multilingual_desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EDITORIAL TEXT BLOCK */}
        <section id="mission" className="py-20 bg-[#F4F2E9] border-y border-[#E7E5D8]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2D6A4F] bg-white px-4 py-1.5 rounded-full border border-[#D8D5C5]">
              {t('editorial_badge')}
            </span>
            <h2 className="mt-6 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#14251B] leading-tight">
              {t('editorial_heading')}
            </h2>
            <div className="mt-6 space-y-4 text-sm sm:text-base text-[#314636] leading-relaxed">
              <p>{t('editorial_p1')}</p>
              <p>{t('editorial_p2')}</p>
            </div>
            <div className="mt-8 pt-8 border-t border-[#DCD9CB] flex items-center justify-center gap-3 text-sm font-semibold text-[#1E4620]">
              <CheckCircle2 className="w-5 h-5 text-[#2D6A4F]" />
              <span>{t('editorial_quote')}</span>
            </div>
          </div>
        </section>

        {/* CLOSING "GET STARTED NOW" SECTION */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-[#1E4620] text-white rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                {t('closing_heading')}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-emerald-100 max-w-xl mx-auto font-normal">
                {t('closing_subtext')}
              </p>

              {/* Small Thumbnail Images Row */}
              <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=400&q=80"
                    alt="Farmer thumbnail 1"
                    onError={(e) => handleImageFallback(e, fallbackFarmland)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white shadow-lg transform scale-105">
                  <img
                    src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=400&q=80"
                    alt="Crop harvest thumbnail 2"
                    onError={(e) => handleImageFallback(e, fallbackFarmland)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=400&q=80"
                    alt="Healthy seedling thumbnail 3"
                    onError={(e) => handleImageFallback(e, fallbackFarmland)}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Chips */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-emerald-100">
                <span className="bg-emerald-800/80 px-3 py-1 rounded-full border border-emerald-600/40">
                  ✓ {t('closing_chip_1')}
                </span>
                <span className="bg-emerald-800/80 px-3 py-1 rounded-full border border-emerald-600/40">
                  ✓ {t('closing_chip_2')}
                </span>
                <span className="bg-emerald-800/80 px-3 py-1 rounded-full border border-emerald-600/40">
                  ✓ {t('closing_chip_3')}
                </span>
              </div>

              {/* Primary CTA Button */}
              <div className="mt-8">
                <Link
                  to="/register"
                  id="closing-get-started-btn"
                  className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl text-base sm:text-lg font-bold text-[#14251B] bg-amber-400 hover:bg-amber-300 shadow-lg hover:shadow-xl transition-all group"
                >
                  <span>{t('closing_cta')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
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
