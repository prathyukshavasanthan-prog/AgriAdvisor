import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Sprout, 
  MapPin, 
  Calendar, 
  Info, 
  Building2,
  RefreshCw
} from 'lucide-react';

import { useAuth } from '../context/AuthContext.js';

interface PricePoint {
  date: string;
  price: number;
  min_price?: number;
  max_price?: number;
}

interface MarketTrendData {
  crop_type: string;
  current_price: number;
  min_price?: number;
  max_price?: number;
  market: string;
  state: string;
  price_date: string;
  trend_direction: 'up' | 'down' | 'steady';
  change_pct: number;
  price_change: number;
  high_rise: boolean;
  selling_note: string | null;
  history: PricePoint[];
  source: 'agmarknet_live' | 'agmarknet_dataset';
  source_label: string;
  live_api_status: string;
  cached: boolean;
}

interface MarketPricesViewProps {
  farms: any[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const MarketPricesView: React.FC<MarketPricesViewProps> = ({ farms }) => {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [marketData, setMarketData] = useState<Record<string, MarketTrendData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'farmer_crops' | 'all_benchmarks'>('farmer_crops');
  const [hoveredPoint, setHoveredPoint] = useState<{ crop: string; date: string; price: number } | null>(null);

  // Extract unique crop types from farmer's farms
  const farmerCropTypes = useMemo(() => {
    const set = new Set<string>();
    farms.forEach((farm) => {
      if (farm.crops && Array.isArray(farm.crops)) {
        farm.crops.forEach((c: any) => {
          if (c.crop_type) set.add(c.crop_type.toLowerCase());
        });
      }
      if (farm.activeCrop?.crop_type) {
        set.add(farm.activeCrop.crop_type.toLowerCase());
      }
    });
    return Array.from(set);
  }, [farms]);

  // Default national staple benchmark crops
  const benchmarkCrops = ['wheat', 'rice', 'cotton', 'chickpea', 'tomato', 'potato', 'onion', 'mustard'];

  // List of crops to display depending on tab
  const displayedCrops = useMemo(() => {
    if (activeTab === 'farmer_crops' && farmerCropTypes.length > 0) {
      return farmerCropTypes;
    }
    return benchmarkCrops;
  }, [activeTab, farmerCropTypes]);

  // Fetch market trends for a list of crops
  const fetchMarketTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allCropsToQuery = Array.from(new Set([...farmerCropTypes, ...benchmarkCrops]));
      const cropsQuery = allCropsToQuery.join(',');

      const res = await fetch(`${API_BASE_URL}/api/market?crops=${cropsQuery}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.data)) {
        const mapped: Record<string, MarketTrendData> = {};
        data.data.forEach((item: MarketTrendData) => {
          mapped[item.crop_type.toLowerCase()] = item;
        });
        setMarketData(mapped);
      } else {
        setError(data.message || 'Failed to load market rates');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching market rates');
    } finally {
      setLoading(false);
    }
  }, [farmerCropTypes, token]);

  useEffect(() => {
    fetchMarketTrends();
  }, [fetchMarketTrends]);

  // Helper to render responsive SVG trend line chart
  const renderTrendChart = (cropType: string, history: PricePoint[], trendDirection: 'up' | 'down' | 'steady') => {
    if (!history || history.length < 2) return null;

    const width = 360;
    const height = 120;
    const padding = { top: 15, right: 15, bottom: 25, left: 45 };

    const prices = history.map((p) => p.price);
    const minPrice = Math.min(...prices) * 0.98;
    const maxPrice = Math.max(...prices) * 1.02;
    const priceRange = maxPrice - minPrice || 1;

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = history.map((p, idx) => {
      const x = padding.left + (idx / (history.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((p.price - minPrice) / priceRange) * chartHeight;
      return { x, y, date: p.date, price: p.price };
    });

    const pathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, '');

    // Area fill under line
    const areaD = `${pathD} L ${points[points.length - 1].x},${padding.top + chartHeight} L ${points[0].x},${padding.top + chartHeight} Z`;

    const strokeColor = trendDirection === 'up' ? '#1E4620' : trendDirection === 'down' ? '#E11D48' : '#64748B';
    const fillColor = trendDirection === 'up' ? '#EBF5EE' : trendDirection === 'down' ? '#FFE4E6' : '#F1F5F9';

    return (
      <div className="w-full mt-3 pt-3 border-t border-stone-200">
        <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            {t('market_history_chart_title')}
          </span>
          {hoveredPoint && hoveredPoint.crop === cropType ? (
            <span className="text-[#1E4620] font-black bg-[#EBF5EE] px-2 py-0.5 rounded text-[11px] border border-[#2D6A4F]/20">
              {hoveredPoint.date}: ₹{hoveredPoint.price.toLocaleString()}
            </span>
          ) : (
            <span className="text-[11px] text-stone-400">{t('market_14_days', '14 Days')}</span>
          )}
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-28 overflow-visible select-none"
        >
          <defs>
            <linearGradient id={`grad-${cropType}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Horizontal grid guide lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="#E2E8F0"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartHeight / 2}
            x2={width - padding.right}
            y2={padding.top + chartHeight / 2}
            stroke="#E2E8F0"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="#CBD5E1"
          />

          {/* Y Axis Price Labels */}
          <text
            x={padding.left - 6}
            y={padding.top + 4}
            textAnchor="end"
            fontSize="9"
            fill="#64748B"
            fontWeight="bold"
          >
            ₹{Math.round(maxPrice)}
          </text>
          <text
            x={padding.left - 6}
            y={padding.top + chartHeight}
            textAnchor="end"
            fontSize="9"
            fill="#64748B"
            fontWeight="bold"
          >
            ₹{Math.round(minPrice)}
          </text>

          {/* Area Fill */}
          <path d={areaD} fill={`url(#grad-${cropType})`} />

          {/* Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Plot Dots */}
          {points.map((pt, idx) => (
            <g
              key={idx}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredPoint({ crop: cropType, date: pt.date, price: pt.price })}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={idx === points.length - 1 ? 4 : 2.5}
                fill={idx === points.length - 1 ? strokeColor : '#FFFFFF'}
                stroke={strokeColor}
                strokeWidth={idx === points.length - 1 ? 2 : 1.5}
                className="transition-all hover:r-5"
              />
            </g>
          ))}

          {/* X Axis Date Labels (Start and End) */}
          <text
            x={padding.left}
            y={height - 5}
            textAnchor="start"
            fontSize="9"
            fill="#64748B"
            fontWeight="bold"
          >
            {history[0].date.slice(5)}
          </text>
          <text
            x={width - padding.right}
            y={height - 5}
            textAnchor="end"
            fontSize="9"
            fill="#64748B"
            fontWeight="bold"
          >
            {history[history.length - 1].date.slice(5)}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-[#D8D5C5] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold bg-[#EBF5EE] text-[#1E4620] px-2.5 py-0.5 rounded-full border border-[#2D6A4F]/20 uppercase tracking-wider">
              {t('market_badge_data_observation')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#14251B] mt-1 tracking-tight">
            {t('market_prices_title')}
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
            {t('market_prices_sub')}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMarketTrends}
          disabled={loading}
          className="h-10 px-4 rounded-xl bg-white border border-stone-300 hover:border-[#1E4620] text-stone-700 font-bold text-xs flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-xs self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('market_refresh_rates', 'Refresh Rates')}</span>
        </button>
      </div>

      {/* Official Government Data Source Notice */}
      <div className="bg-[#FBFBF9] border border-stone-200 rounded-3xl p-4 sm:p-5 shadow-xs flex items-start gap-3.5">
        <div className="p-2 bg-stone-100 border border-stone-200 rounded-xl flex-shrink-0 text-stone-600">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
          <div className="font-bold text-[#14251B] mb-0.5 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#1E4620]" />
            <span>{t('agmarknet_source_label', 'Ministry of Agriculture & Farmers Welfare — Agmarknet Data')}</span>
          </div>
          <p className="text-stone-600">
            {t('market_source_disclaimer')}
          </p>
        </div>
      </div>

      {/* Tabs: Cultivator's Plots Crops vs Benchmark Staple Mandi Rates */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          id="market-tab-farmer-crops"
          onClick={() => setActiveTab('farmer_crops')}
          className={`h-9 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'farmer_crops'
              ? 'bg-[#1E4620] text-white shadow-xs'
              : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-50'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>{t('market_view_farm_crops')} ({farmerCropTypes.length})</span>
        </button>

        <button
          type="button"
          id="market-tab-all-benchmarks"
          onClick={() => setActiveTab('all_benchmarks')}
          className={`h-9 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'all_benchmarks'
              ? 'bg-[#1E4620] text-white shadow-xs'
              : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t('market_empty_crops_title')}</span>
        </button>
      </div>

      {/* State / Loading / Error */}
      {loading && Object.keys(marketData).length === 0 ? (
        <div className="bg-white border border-[#D8D5C5] rounded-3xl p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1E4620] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">{t('loading_mandi_prices', 'Loading mandi prices & 14-day history...')}</span>
        </div>
      ) : error ? (
        <div className="bg-white border border-rose-200 rounded-3xl p-6 text-center space-y-3">
          <div className="text-rose-600 font-bold">{error}</div>
          <button
            onClick={fetchMarketTrends}
            className="h-9 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs"
          >
            Retry
          </button>
        </div>
      ) : displayedCrops.length === 0 ? (
        <div className="bg-white border border-[#D8D5C5] rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">{t('market_empty_crops_title')}</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">{t('market_empty_crops_sub')}</p>
          <button
            onClick={() => setActiveTab('all_benchmarks')}
            className="h-9 px-4 bg-[#1E4620] text-white font-bold rounded-xl text-xs hover:bg-[#163719]"
          >
            View Staple Mandi Benchmarks
          </button>
        </div>
      ) : (
        /* Large Readable Crop Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedCrops.map((cropType) => {
            const data = marketData[cropType.toLowerCase()];
            const hasData = Boolean(data);

            const isUp = data?.trend_direction === 'up';
            const isDown = data?.trend_direction === 'down';

            return (
              <div
                key={cropType}
                className="bg-white border border-[#D8D5C5] rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-[#1E4620]/40 transition-all"
              >
                <div>
                  {/* Card Header: Crop Icon & Name + Mandi Location */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center flex-shrink-0 font-bold border border-[#2D6A4F]/20">
                        <Sprout className="w-6 h-6 text-[#2D6A4F]" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-[#14251B] capitalize tracking-tight">
                          {String(t(`crop_${cropType}` as any, cropType))}
                        </h3>
                        <div className="text-xs text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span>{data?.market || 'APMC Mandi'}, {data?.state || 'India'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Trend Indicator: Arrow Icon + Percentage (Never color alone) */}
                    {hasData && (
                      <div
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isUp
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isDown
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {isUp ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        ) : isDown ? (
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-stone-500 stroke-[2.5]" />
                        )}
                        <span>
                          {data.change_pct > 0 ? `+${data.change_pct}%` : `${data.change_pct}%`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price Section */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                        {t('market_current_price_label')}
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-[#14251B] tracking-tight mt-0.5">
                        {hasData ? `₹${data.current_price.toLocaleString()}` : '—'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-stone-500 font-semibold">{t('market_quintal_unit')}</div>
                      {hasData && (
                        <div className="text-[11px] text-stone-400">
                          {data.price_change > 0 ? `+₹${data.price_change}` : `₹${data.price_change}`} 7d
                        </div>
                      )}
                    </div>
                  </div>

                  {/* HIGH-RISE NOTE: If price rose meaningfully (>10% in past week) */}
                  {hasData && data.high_rise && (
                    <div className="mt-3.5 bg-[#FFFBEB] border border-amber-300 rounded-2xl p-3 text-xs shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-[#14251B]">
                        <TrendingUp className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                        <span>{t('market_high_rise_note')}</span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                        {t('market_high_rise_sub')}
                      </p>
                    </div>
                  )}

                  {/* 14-Day Trend Chart SVG */}
                  {hasData && renderTrendChart(cropType, data.history, data.trend_direction)}
                </div>

                {/* Card Footer: Date & Source tag */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                  <span>As of: {data?.price_date || new Date().toISOString().split('T')[0]}</span>
                  <span className="font-semibold text-stone-500">
                    {data?.source === 'agmarknet_live' ? 'Live Agmarknet' : 'Agmarknet Dataset'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
