import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sprout, 
  Plus, 
  MapPin, 
  ArrowRight, 
  Edit3, 
  Trash2,
  LayoutGrid
} from 'lucide-react';
import { FarmMapView } from './FarmMapView.js';

interface FarmListViewProps {
  farms: any[];
  loading: boolean;
  onAddNew: () => void;
  onSelectFarm: (farmId: string) => void;
  onEditFarm: (farm: any) => void;
  onDeleteFarm: (farmId: string) => void;
  token?: string | null;
}

export const FarmListView: React.FC<FarmListViewProps> = ({
  farms,
  loading,
  onAddNew,
  onSelectFarm,
  onEditFarm,
  onDeleteFarm,
  token,
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');

  if (loading) {
    return (
      <div className="bg-white border border-[#D8D5C5] rounded-3xl p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#1E4620] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">{t('loading_registered_farms', 'Loading your registered farms...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#D8D5C5] rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#14251B] tracking-tight">
            {t('farms_page_title')}
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
            {t('farms_page_sub')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher: Cards vs Farm Map (GIS) */}
          <div className="bg-stone-100 p-1 rounded-2xl flex items-center border border-stone-200 shadow-2xs">
            <button
              type="button"
              id="farm-view-mode-cards-btn"
              onClick={() => setViewMode('cards')}
              className={`h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#1E4620] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t('map_view_cards')}</span>
            </button>
            <button
              type="button"
              id="farm-view-mode-map-btn"
              onClick={() => setViewMode('map')}
              className={`h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-[#1E4620] text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('map_view_gis')}</span>
            </button>
          </div>

          <button
            type="button"
            id="add-new-farm-main-btn"
            onClick={onAddNew}
            className="h-11 px-5 rounded-2xl bg-[#1E4620] hover:bg-[#163719] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300 stroke-[2.5]" />
            <span>{t('btn_add_farm')}</span>
          </button>
        </div>
      </div>

      {/* View Content: GIS Map View or Cards Grid */}
      {viewMode === 'map' ? (
        <FarmMapView
          onSelectFarm={onSelectFarm}
          onAddNew={onAddNew}
          token={token || null}
        />
      ) : farms.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#D8D5C5] rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center mx-auto shadow-xs">
            <Sprout className="w-8 h-8 text-[#2D6A4F]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#14251B]">
              {t('farms_empty_title')}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {t('farms_empty_sub')}
            </p>
          </div>
          <button
            type="button"
            id="empty-state-add-farm-btn"
            onClick={onAddNew}
            className="h-11 px-6 rounded-2xl bg-[#1E4620] hover:bg-[#163719] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>{t('btn_add_farm')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => {
            const activeCrop = farm.activeCrop || (farm.crops && farm.crops[0]);
            const hasValidCoords = 
              typeof farm.latitude === 'number' && !isNaN(farm.latitude) &&
              typeof farm.longitude === 'number' && !isNaN(farm.longitude) &&
              !(farm.latitude === 0 && farm.longitude === 0) &&
              farm.latitude >= -90 && farm.latitude <= 90 &&
              farm.longitude >= -180 && farm.longitude <= 180;

            return (
              <div
                key={farm._id}
                className="bg-white border border-[#D8D5C5] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Top card bar: Name + Area + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#14251B] tracking-tight">
                        {farm.name}
                      </h3>
                      <div className="text-xs font-medium flex items-center gap-1.5 mt-0.5">
                        <MapPin className={`w-3.5 h-3.5 ${hasValidCoords ? 'text-stone-400' : 'text-amber-500'}`} />
                        {hasValidCoords ? (
                          <span className="text-stone-500">{farm.latitude.toFixed(2)}°N, {farm.longitude.toFixed(2)}°E</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">{t('farm_location_not_set')}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-[#EBF5EE] text-[#1E4620] border border-[#2D6A4F]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {farm.area} {t('crop_acres')}
                    </span>
                  </div>

                  {/* Active Crop Info */}
                  <div className="mt-4 bg-[#FBFBF9] border border-stone-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 text-[#1E4620] flex items-center justify-center font-bold">
                        <Sprout className="w-4 h-4 text-[#2D6A4F]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-800 capitalize">
                          {activeCrop ? String(t(`crop_${activeCrop.crop_type}` as any, activeCrop.crop_type)) : 'No crop registered'}
                        </div>
                        <div className="text-[10px] text-stone-400 font-medium">
                          {activeCrop ? `${t('crop_status_label')}: ${String(t(`crop_status_${activeCrop.status}` as any, activeCrop.status))}` : 'Cycle inactive'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded uppercase">
                      {String(t(`farm_soil_${farm.soil_type}` as any, farm.soil_type))}
                    </span>
                  </div>

                  {/* Soil NPK Summary */}
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <div className="bg-stone-50 rounded-xl p-2 border border-stone-200/60">
                      <div className="text-[10px] text-stone-400 font-bold">N</div>
                      <div className="text-xs font-black text-stone-700">{farm.soil_n ?? 90}</div>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-2 border border-stone-200/60">
                      <div className="text-[10px] text-stone-400 font-bold">P</div>
                      <div className="text-xs font-black text-stone-700">{farm.soil_p ?? 42}</div>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-2 border border-stone-200/60">
                      <div className="text-[10px] text-stone-400 font-bold">K</div>
                      <div className="text-xs font-black text-stone-700">{farm.soil_k ?? 43}</div>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-2 border border-stone-200/60">
                      <div className="text-[10px] text-stone-400 font-bold">pH</div>
                      <div className="text-xs font-black text-[#1E4620]">{farm.soil_ph ?? 6.5}</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditFarm(farm)}
                      className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
                      title={t('btn_edit_farm')}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteFarm(farm._id)}
                      className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
                      title={t('btn_delete_farm')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    id={`view-details-${farm._id}`}
                    onClick={() => onSelectFarm(farm._id)}
                    className="h-9 px-3.5 rounded-xl bg-[#EBF5EE] hover:bg-[#d5eed9] text-[#1E4620] border border-[#2D6A4F]/20 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>{t('btn_view_details')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
