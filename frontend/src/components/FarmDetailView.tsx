import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  MapPin, 
  Thermometer, 
  Wind, 
  Droplets,
  Edit3, 
  Trash2, 
  Plus, 
  Layers, 
  FlaskConical,
  Sprout,
  CheckCircle2,
  MinusCircle,
  AlertTriangle,
  Camera,
  Upload,
  X,
  Clock,
  Activity,
  FileText,
  Sparkles,
  CheckSquare,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  Info,
  Calendar
} from 'lucide-react';
import { SAMPLE_LEAF_IMAGES } from '../data/sampleLeafImages.js';
import { useAuth } from '../context/AuthContext.js';
import { SpeechListenButton } from './SpeechListenButton.js';

interface FarmDetailViewProps {
  farmId: string;
  onBack: () => void;
  onEditFarm: (farm: any) => void;
  onFarmDeleted: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const FarmDetailView: React.FC<FarmDetailViewProps> = ({
  farmId,
  onBack,
  onEditFarm,
  onFarmDeleted,
}) => {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [farmData, setFarmData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New crop cycle modal state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [newCropType, setNewCropType] = useState('rice');
  const [newSowingDate, setNewSowingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newHarvestDate, setNewHarvestDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 115);
    return d.toISOString().split('T')[0];
  });
  const [addingCrop, setAddingCrop] = useState(false);

  // Health Monitoring State (Part 1 & 3: Quick Check-in vs AI Photo Diagnosis)
  const [healthMode, setHealthMode] = useState<'quick' | 'ai'>('quick');
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [healthLogs, setHealthLogs] = useState<any[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthStreak, setHealthStreak] = useState(0);
  const [hasConcerningAlert, setHasConcerningAlert] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'Healthy' | 'Okay' | 'Concerning'>('Healthy');
  const [healthNotes, setHealthNotes] = useState('');
  const [healthPhoto, setHealthPhoto] = useState('');
  const [submittingHealth, setSubmittingHealth] = useState(false);
  const [healthSuccessMsg, setHealthSuccessMsg] = useState(false);

  // AI Photo Diagnosis State
  const [aiLeafPhoto, setAiLeafPhoto] = useState<string>('');
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<any | null>(null);
  const [savingAiLog, setSavingAiLog] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Crop Lifecycle State (Module 6)
  const [cropLifecycle, setCropLifecycle] = useState<any | null>(null);


  // Fetch Direct Farm Details (Specs, Soil test, Live Weather, Crop Cycles)
  const fetchFarmDetails = useCallback(async () => {
    if (!token || !farmId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFarmData(data.data);
      } else {
        setError(data.message || 'Farm not found');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [farmId, token]);

  useEffect(() => {
    fetchFarmDetails();
  }, [fetchFarmDetails]);

  // Set initial selected crop when farmData is retrieved
  useEffect(() => {
    if (farmData?.crops && farmData.crops.length > 0) {
      if (!selectedCropId || !farmData.crops.some((c: any) => c._id === selectedCropId)) {
        setSelectedCropId(farmData.crops[0]._id);
      }
    }
  }, [farmData, selectedCropId]);

  // Fetch health logs for selected crop
  const fetchHealthLogs = useCallback(async (cropId: string) => {
    if (!token || !cropId || !farmId) return;
    setLoadingHealth(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/crops/${cropId}/health-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHealthLogs(data.data || []);
        setHealthStreak(data.consecutive_concerning_count || 0);
        setHasConcerningAlert(Boolean(data.has_concerning_alert));
      }
    } catch (err) {
      console.error('[FarmDetailView] Failed to fetch crop health logs:', err);
    } finally {
      setLoadingHealth(false);
    }
  }, [farmId, token]);

  // Fetch Crop Lifecycle details (Module 6)
  const fetchCropLifecycle = useCallback(async (cropId: string) => {
    if (!token || !cropId || !farmId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/crops/${cropId}/lifecycle`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCropLifecycle(data.data);
      }
    } catch (err) {
      console.warn('[FarmDetailView] Failed to load crop lifecycle:', err);
    }
  }, [farmId, token]);

  useEffect(() => {
    if (selectedCropId) {
      fetchHealthLogs(selectedCropId);
      fetchCropLifecycle(selectedCropId);
    }
  }, [selectedCropId, fetchHealthLogs, fetchCropLifecycle]);

  // Handle Photo selection via FileReader
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHealthPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Health Check-in submission
  const handleSubmitHealthCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCropId || !token) return;
    setSubmittingHealth(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/crops/${selectedCropId}/health-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          health_status: selectedStatus,
          notes: healthNotes,
          photo_url: healthPhoto,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setHealthNotes('');
        setHealthPhoto('');
        setHealthSuccessMsg(true);
        setTimeout(() => setHealthSuccessMsg(false), 3000);
        fetchHealthLogs(selectedCropId);
      }
    } catch (err) {
      console.error('[FarmDetailView] Failed to record health check-in:', err);
    } finally {
      setSubmittingHealth(false);
    }
  };

  // AI Photo Diagnosis Handlers
  const handleSelectSampleLeaf = (dataUrl: string) => {
    setAiLeafPhoto(dataUrl);
    setAiDiagnosis(null);
    setAiError(null);
  };

  const handleAiPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAiLeafPhoto(reader.result as string);
        setAiDiagnosis(null);
        setAiError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAIDiagnosis = async () => {
    if (!aiLeafPhoto || !selectedCropId || !token) return;
    setAiAnalyzing(true);
    setAiError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/crops/${selectedCropId}/diagnose-health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: aiLeafPhoto }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAiDiagnosis(data.prediction);
      } else {
        setAiError(data.message || 'Diagnosis service error');
      }
    } catch (err: any) {
      console.error('[FarmDetailView] AI Diagnosis error:', err);
      setAiError(err.message || 'Failed to connect to AI diagnosis service');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSaveAIDiagnosisToHistory = async () => {
    if (!aiDiagnosis || !selectedCropId || !token) return;
    setSavingAiLog(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/crops/${selectedCropId}/diagnose-health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: aiLeafPhoto,
          save_to_history: true,
          notes: `AI Photo Diagnosis: ${aiDiagnosis.predicted_class} (${aiDiagnosis.confidence} Confidence)`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHealthSuccessMsg(true);
        setTimeout(() => setHealthSuccessMsg(false), 3000);
        fetchHealthLogs(selectedCropId);
      }
    } catch (err) {
      console.error('[FarmDetailView] Save AI diagnosis error:', err);
    } finally {
      setSavingAiLog(false);
    }
  };

  // Handle Delete Farm
  const handleDeleteFarm = async () => {
    if (!window.confirm('Are you sure you want to delete this farm? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onFarmDeleted();
      }
    } catch (err) {
      console.error('Failed to delete farm:', err);
    }
  };

  // Handle Add New Crop Cycle
  const handleAddCropCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCrop(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/crops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          crop_type: newCropType,
          sowing_date: newSowingDate,
          expected_harvest_date: newHarvestDate,
          status: 'growing',
        }),
      });

      if (res.ok) {
        setIsCropModalOpen(false);
        fetchFarmDetails();
      }
    } catch (err) {
      console.error('Failed to add crop:', err);
    } finally {
      setAddingCrop(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#D8D5C5] rounded-3xl p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#1E4620] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading farm details...</span>
      </div>
    );
  }

  if (error || !farmData) {
    return (
      <div className="bg-white border border-[#D8D5C5] rounded-3xl p-8 text-center space-y-4">
        <div className="text-rose-600 font-bold">{error || 'Farm not found'}</div>
        <button
          onClick={onBack}
          className="h-10 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs"
        >
          {t('dash_nav_farms')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          id="farm-back-btn"
          className="h-10 px-4 rounded-xl bg-white border border-stone-300 text-stone-700 hover:text-[#1E4620] font-bold text-xs sm:text-sm flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('dash_nav_farms')}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="edit-current-farm-btn"
            onClick={() => onEditFarm(farmData)}
            className="h-10 px-3.5 rounded-xl bg-white border border-stone-300 hover:border-[#1E4620] text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-stone-500" />
            <span>{t('btn_edit_farm')}</span>
          </button>

          <button
            type="button"
            id="delete-current-farm-btn"
            onClick={handleDeleteFarm}
            className="h-10 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>{t('btn_delete_farm')}</span>
          </button>
        </div>
      </div>

      {/* Farm Header Banner: Direct Plot Specs + Live Weather */}
      <div className="bg-white border border-[#D8D5C5] rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center font-bold shadow-xs">
            <Sprout className="w-7 h-7 text-[#2D6A4F]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-[#14251B] tracking-tight">
                {farmData.name}
              </h1>
              <span className="text-[11px] font-bold bg-[#EBF5EE] text-[#1E4620] border border-[#2D6A4F]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {farmData.area} {t('crop_acres')}
              </span>
            </div>
            <div className="text-xs text-stone-500 font-medium flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                {farmData.latitude.toFixed(3)}°N, {farmData.longitude.toFixed(3)}°E
              </span>
              <span>•</span>
              <span className="capitalize">{String(t(`farm_soil_${farmData.soil_type}` as any, `${farmData.soil_type} soil`))}</span>
            </div>
          </div>
        </div>

        {/* Live Weather Widget for Farm Coordinates (Direct Weather Data) */}
        {farmData.weather && (
          <div className="bg-[#FBFBF9] border border-stone-200 rounded-2xl px-4 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-600" />
              <div>
                <div className="text-[10px] text-stone-500 font-bold uppercase">{t('dash_metric_temp_label')}</div>
                <div className="text-sm font-black text-stone-800">{farmData.weather.temperature}°C</div>
              </div>
            </div>
            <div className="h-7 w-[1px] bg-stone-200" />
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-600" />
              <div>
                <div className="text-[10px] text-stone-500 font-bold uppercase">{t('weather_humidity_label')}</div>
                <div className="text-sm font-black text-stone-800">{farmData.weather.humidity}%</div>
              </div>
            </div>
            <div className="h-7 w-[1px] bg-stone-200" />
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-stone-500" />
              <div>
                <div className="text-[10px] text-stone-500 font-bold uppercase">Wind</div>
                <div className="text-sm font-black text-stone-800">{farmData.weather.wind_speed} km/h</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Direct Soil Chemistry Details & Crop Cycles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soil Chemistry Profile Card (Direct Soil Test Data) */}
        <div className="bg-white border border-[#D8D5C5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#1E4620]" />
              {t('farm_soil_test_badge')}
            </span>
            <span className="text-[11px] font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
              {String(t(`farm_soil_${farmData.soil_type}` as any, farmData.soil_type))}
            </span>
          </div>

          <p className="text-xs text-stone-500 font-medium">
            {t('farm_soil_helper_note')}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-[#FBFBF9] border border-stone-200 rounded-2xl p-3 text-center">
              <div className="text-[11px] font-bold text-stone-500 uppercase">{t('farm_field_soil_n')}</div>
              <div className="text-xl font-black text-[#1E4620] mt-1">{farmData.soil_n ?? 90}</div>
              <div className="text-[10px] text-stone-400">kg/ha</div>
            </div>

            <div className="bg-[#FBFBF9] border border-stone-200 rounded-2xl p-3 text-center">
              <div className="text-[11px] font-bold text-stone-500 uppercase">{t('farm_field_soil_p')}</div>
              <div className="text-xl font-black text-[#1E4620] mt-1">{farmData.soil_p ?? 42}</div>
              <div className="text-[10px] text-stone-400">kg/ha</div>
            </div>

            <div className="bg-[#FBFBF9] border border-stone-200 rounded-2xl p-3 text-center">
              <div className="text-[11px] font-bold text-stone-500 uppercase">{t('farm_field_soil_k')}</div>
              <div className="text-xl font-black text-[#1E4620] mt-1">{farmData.soil_k ?? 43}</div>
              <div className="text-[10px] text-stone-400">kg/ha</div>
            </div>

            <div className="bg-[#FBFBF9] border border-stone-200 rounded-2xl p-3 text-center">
              <div className="text-[11px] font-bold text-stone-500 uppercase">{t('farm_field_soil_ph')}</div>
              <div className="text-xl font-black text-[#1E4620] mt-1">{farmData.soil_ph ?? 6.5}</div>
              <div className="text-[10px] text-stone-400">Acidity Scale</div>
            </div>
          </div>
        </div>

        {/* Crop Cycles Card (Direct Crop History & Active Status) */}
        <div className="bg-white border border-[#D8D5C5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1E4620]" />
              {t('crop_heading')}
            </span>
            <button
              type="button"
              id="add-crop-cycle-btn"
              onClick={() => setIsCropModalOpen(true)}
              className="h-8 px-2.5 rounded-lg bg-[#EBF5EE] hover:bg-[#d5eed9] text-[#1E4620] border border-[#2D6A4F]/20 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('btn_add_crop')}</span>
            </button>
          </div>

          {farmData.crops && farmData.crops.length > 0 ? (
            <div className="space-y-3">
              {farmData.crops.map((c: any) => (
                <div
                  key={c._id}
                  className="bg-[#FBFBF9] border border-stone-200 rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center font-bold">
                      <Sprout className="w-5 h-5 text-[#2D6A4F]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-800 capitalize">
                        {String(t(`crop_${c.crop_type}` as any, c.crop_type))}
                      </div>
                      <div className="text-xs text-stone-500 font-medium flex items-center gap-2">
                        <span>{t('crop_sowing_date')}: {new Date(c.sowing_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{t('crop_harvest_date')}: {new Date(c.expected_harvest_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full capitalize">
                    {String(t(`crop_status_${c.status}` as any, c.status))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-stone-400">
              No crop cycles registered for this plot yet.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CROP GROWTH STAGE & LIFECYCLE SECTION (Module 6) */}
      {/* ========================================================================= */}
      {selectedCropId && cropLifecycle && (
        <div id="farm-crop-lifecycle-section" className="bg-white border border-[#D8D5C5] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EBF5EE] text-[#1E4620] flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold bg-[#EBF5EE] text-[#1E4620] px-2.5 py-0.5 rounded-full border border-[#2D6A4F]/20 uppercase tracking-wider">
                    ICAR Growth Cycle
                  </span>
                  <SpeechListenButton
                    id="btn-listen-crop-lifecycle"
                    textToSpeak={`Growth stage for ${cropLifecycle.display_name} is ${cropLifecycle.current_stage?.stage_name}. Day ${cropLifecycle.days_elapsed} of ${cropLifecycle.total_duration_days}. Sowing status: ${cropLifecycle.sowing_advisory?.sowing_status}. ${cropLifecycle.sowing_advisory?.sowing_note || ''}`}
                  />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#14251B] mt-1 tracking-tight">
                  {t('lifecycle_section_title')}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                  {t('lifecycle_section_sub')}
                </p>
              </div>
            </div>

            {/* Current Sowing Season Status Badge */}
            <div>
              {cropLifecycle.sowing_advisory?.sowing_status === 'in_season' && (
                <span id="lifecycle-badge-in-season" className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t('sowing_status_in_season')}</span>
                </span>
              )}
              {cropLifecycle.sowing_advisory?.sowing_status === 'approaching_sowing' && (
                <span id="lifecycle-badge-approaching" className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-amber-800" />
                  <span>{t('sowing_status_approaching')}</span>
                </span>
              )}
              {cropLifecycle.sowing_advisory?.sowing_status === 'outside_window' && (
                <span id="lifecycle-badge-out-of-season" className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 px-3 py-1 rounded-full shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                  <span>{t('sowing_status_out_of_season')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Out of Season Warning Alert (if out of season) */}
          {cropLifecycle.sowing_advisory?.sowing_status === 'outside_window' && (
            <div id="lifecycle-out-of-season-alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 block">
                  Out-of-Season Cultivation Advisory
                </span>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                  {cropLifecycle.sowing_advisory.sowing_note}
                </p>
              </div>
            </div>
          )}

          {/* Primary Stage Card & Progress Bar */}
          <div className="bg-[#FBFBF9] border border-stone-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Current Growth Stage
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#1E4620] tracking-tight mt-0.5">
                  {cropLifecycle.current_stage?.stage_name}
                </div>
                <p className="text-xs text-stone-600 mt-1 font-medium">
                  {cropLifecycle.current_stage?.description}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  Expected Harvest
                </span>
                <div className="text-base sm:text-lg font-bold text-stone-800">
                  {new Date(cropLifecycle.expected_harvest_date).toLocaleDateString()}
                </div>
                <span className="text-xs text-stone-500 font-medium">
                  Day {cropLifecycle.days_elapsed} of {cropLifecycle.total_duration_days}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-600">
                <span>Cycle Progression</span>
                <span>{cropLifecycle.progress_percentage}% Completed</span>
              </div>
              <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#2D6A4F] to-[#52B788] transition-all duration-500 rounded-full"
                  style={{ width: `${cropLifecycle.progress_percentage}%` }}
                />
              </div>
            </div>

            {/* 4 Growth Milestones Progress Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2">
              {cropLifecycle.milestones?.map((m: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs transition ${
                    m.current
                      ? 'bg-emerald-50 border-[#2D6A4F] text-[#1E4620] shadow-2xs ring-1 ring-[#2D6A4F]/20'
                      : m.completed
                      ? 'bg-stone-50 border-stone-200 text-stone-700'
                      : 'bg-white border-stone-200 text-stone-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>Stage {idx + 1}</span>
                    {m.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : m.current ? (
                      <span className="w-2 h-2 rounded-full bg-[#1E4620] animate-ping" />
                    ) : (
                      <span className="text-[10px] text-stone-400">Day {m.day_start}+</span>
                    )}
                  </div>
                  <div className="font-bold truncate">{m.stage_name}</div>
                  <div className="text-[11px] text-stone-500 truncate mt-0.5">Days {m.day_start}–{m.day_end}</div>
                </div>
              ))}
            </div>

            {/* Land Preparation Guidance Note */}
            {cropLifecycle.sowing_advisory?.land_preparation_guidance && (
              <div className="p-3.5 bg-white border border-stone-200/80 rounded-xl flex items-start gap-2.5 text-xs">
                <Wind className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-stone-800 block">
                    {t('land_prep_title')}:
                  </span>
                  <p className="text-stone-600 leading-relaxed font-normal">
                    {cropLifecycle.sowing_advisory.land_preparation_guidance}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CROP HEALTH MONITORING & TIMELINE SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#D8D5C5] rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-[#EBF5EE] text-[#1E4620] px-2.5 py-0.5 rounded-full border border-[#2D6A4F]/20 uppercase tracking-wider">
                Field Health Log
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#14251B] mt-1 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#2D6A4F]" />
              <span>{t('health_section_title')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              {t('health_section_sub')}
            </p>
          </div>

          {/* Crop Selector Tabs (if multiple crops exist) */}
          {farmData.crops && farmData.crops.length > 1 && (
            <div className="flex items-center gap-1.5 bg-[#FBFBF9] p-1.5 rounded-2xl border border-stone-200 flex-wrap">
              {farmData.crops.map((c: any) => (
                <button
                  key={c._id}
                  type="button"
                  id={`select-crop-tab-${c.crop_type}`}
                  onClick={() => setSelectedCropId(c._id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                    selectedCropId === c._id
                      ? 'bg-[#1E4620] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
                >
                  {String(t(`crop_${c.crop_type}` as any, c.crop_type))}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2+ CONSECUTIVE CONCERNING ALERT BANNER */}
        {hasConcerningAlert && (
          <div className="bg-[#FFFBEB] border-2 border-amber-400 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs animate-in fade-in duration-300">
            <div className="p-2 bg-amber-200 border border-amber-300 rounded-xl text-amber-900 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  {healthStreak} {t('health_streak_concerning_badge')}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#14251B] mt-1">
                {t('crop_health_alert_banner_title')}
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 mt-0.5 leading-relaxed font-medium">
                {t('crop_health_alert_banner_desc', {
                  crop: farmData.crops?.find((c: any) => c._id === selectedCropId)?.crop_type || 'Crop',
                  farm: farmData.name,
                })}
              </p>
            </div>
          </div>
        )}

        {/* HEALTH CHECK-IN SECTION (Equal alternatives: Quick Check-in vs AI Photo Diagnosis) */}
        <div className="bg-[#FBFBF9] border border-stone-200 rounded-3xl p-5 sm:p-6 space-y-5">
          {/* Section Header & Crop Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-[#2D6A4F]" />
              <h3 className="text-base font-bold text-[#14251B]">
                {t('health_checkin_title')}
              </h3>
            </div>
            {farmData.crops?.find((c: any) => c._id === selectedCropId) && (
              <span className="text-xs font-bold text-[#1E4620] bg-[#EBF5EE] border border-[#2D6A4F]/20 px-2.5 py-0.5 rounded-full capitalize">
                {String(t(`crop_${farmData.crops.find((c: any) => c._id === selectedCropId)?.crop_type}` as any, farmData.crops.find((c: any) => c._id === selectedCropId)?.crop_type))}
              </span>
            )}
          </div>

          {/* Equal Alternative Mode Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
            <button
              type="button"
              id="btn-tab-quick-checkin"
              onClick={() => setHealthMode('quick')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                healthMode === 'quick'
                  ? 'bg-[#1E4620] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{t('health_tab_quick')}</span>
            </button>

            <button
              type="button"
              id="btn-tab-ai-diagnosis"
              onClick={() => setHealthMode('ai')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                healthMode === 'ai'
                  ? 'bg-[#1E4620] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{t('health_tab_ai')}</span>
            </button>
          </div>

          {/* OPTION 1: QUICK CHECK-IN (Manual 3 Tappable Buttons) */}
          {healthMode === 'quick' && (
            <form onSubmit={handleSubmitHealthCheckin} className="space-y-5">
              <p className="text-xs text-stone-500 font-medium">
                {t('health_quick_desc')}
              </p>

              {/* 3 LARGE TAPPABLE BUTTONS (Distinct Icon + Color, Never color alone) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  {t('health_status_label')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Button 1: Healthy */}
                  <button
                    type="button"
                    id="btn-health-healthy"
                    onClick={() => setSelectedStatus('Healthy')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-3 shadow-2xs cursor-pointer ${
                      selectedStatus === 'Healthy'
                        ? 'border-[#2D6A4F] bg-[#EBF5EE] ring-2 ring-[#2D6A4F]/20 text-[#1E4620]'
                        : 'border-stone-200 bg-white hover:border-emerald-300 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded ${
                        selectedStatus === 'Healthy' ? 'bg-[#2D6A4F] text-white' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {selectedStatus === 'Healthy' ? 'Selected' : 'Normal'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#14251B]">
                        {t('health_status_healthy')}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5 font-normal leading-snug">
                        {t('health_status_healthy_desc')}
                      </div>
                    </div>
                  </button>

                  {/* Button 2: Okay */}
                  <button
                    type="button"
                    id="btn-health-okay"
                    onClick={() => setSelectedStatus('Okay')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-3 shadow-2xs cursor-pointer ${
                      selectedStatus === 'Okay'
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20 text-amber-900'
                        : 'border-stone-200 bg-white hover:border-amber-300 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
                        <MinusCircle className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded ${
                        selectedStatus === 'Okay' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {selectedStatus === 'Okay' ? 'Selected' : 'Moderate'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#14251B]">
                        {t('health_status_okay')}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5 font-normal leading-snug">
                        {t('health_status_okay_desc')}
                      </div>
                    </div>
                  </button>

                  {/* Button 3: Concerning */}
                  <button
                    type="button"
                    id="btn-health-concerning"
                    onClick={() => setSelectedStatus('Concerning')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-3 shadow-2xs cursor-pointer ${
                      selectedStatus === 'Concerning'
                        ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/20 text-rose-900'
                        : 'border-stone-200 bg-white hover:border-rose-300 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-800">
                        <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded ${
                        selectedStatus === 'Concerning' ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {selectedStatus === 'Concerning' ? 'Selected' : 'Alert'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#14251B]">
                        {t('health_status_concerning')}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5 font-normal leading-snug">
                        {t('health_status_concerning_desc')}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Optional Short Note Field & Photo Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t('health_notes_label')}</span>
                  </label>
                  <textarea
                    id="health-notes-input"
                    rows={3}
                    value={healthNotes}
                    onChange={(e) => setHealthNotes(e.target.value)}
                    placeholder={t('health_notes_placeholder')}
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white text-xs text-[#14251B] focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t('health_photo_label')}</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="h-10 px-4 rounded-xl bg-white border border-stone-300 hover:border-[#1E4620] text-stone-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-4 h-4 text-stone-500" />
                        <span>{t('health_photo_upload_btn')}</span>
                        <input
                          type="file"
                          id="health-photo-file-input"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </label>
                      {healthPhoto && (
                        <button
                          type="button"
                          onClick={() => setHealthPhoto('')}
                          className="h-10 px-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{t('health_photo_remove')}</span>
                        </button>
                      )}
                    </div>

                    {healthPhoto && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-300 mt-1 shadow-xs">
                        <img src={healthPhoto} alt="Field preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Action */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                {healthSuccessMsg ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check-in saved successfully!</span>
                  </span>
                ) : (
                  <span className="text-xs text-stone-500 font-medium">
                    Streak: {healthStreak} consecutive concerning {healthStreak === 1 ? 'log' : 'logs'}
                  </span>
                )}

                <button
                  type="submit"
                  id="submit-health-checkin-btn"
                  disabled={submittingHealth || !selectedCropId}
                  className="h-10 px-5 rounded-xl bg-[#1E4620] hover:bg-[#163719] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-amber-300" />
                  <span>{submittingHealth ? t('health_btn_submitting') : t('health_btn_submit')}</span>
                </button>
              </div>
            </form>
          )}

          {/* OPTION 2: AI PHOTO DIAGNOSIS (PlantVillage Transfer Learning Model) */}
          {healthMode === 'ai' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-500 font-medium">
                {t('health_ai_desc')}
              </p>

              {/* Sample Authentic Leaves Test Bar */}
              <div className="bg-white p-3 rounded-2xl border border-stone-200 space-y-2">
                <span className="text-[11px] font-bold text-stone-600 block">
                  {t('health_sample_images_label')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_LEAF_IMAGES.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      id={`sample-leaf-${sample.id}`}
                      onClick={() => handleSelectSampleLeaf(sample.dataUrl)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-emerald-50 hover:border-emerald-300 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#1E4620]" />
                      <span>{t(sample.nameKey as any)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Upload Area & Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t('health_upload_leaf_photo')}</span>
                  </label>
                  <div className="border-2 border-dashed border-stone-300 hover:border-[#1E4620] bg-white rounded-2xl p-4 text-center cursor-pointer transition">
                    <label className="cursor-pointer block space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#1E4620] mx-auto flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold text-stone-800">
                        {t('health_drag_leaf_photo')}
                      </div>
                      <span className="text-[11px] text-stone-400 block">
                        Supports JPG, PNG up to 10MB
                      </span>
                      <input
                        type="file"
                        id="ai-leaf-file-input"
                        accept="image/*"
                        onChange={handleAiPhotoSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Preview Thumbnail */}
                <div className="flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Foliage Preview
                    </label>
                    {aiLeafPhoto ? (
                      <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-stone-300 bg-stone-100 flex items-center justify-center">
                        <img src={aiLeafPhoto} alt="Leaf preview" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => {
                            setAiLeafPhoto('');
                            setAiDiagnosis(null);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 bg-stone-900/70 text-white rounded-full flex items-center justify-center hover:bg-stone-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-36 rounded-2xl border border-stone-200 bg-white flex flex-col items-center justify-center text-stone-400 text-xs gap-1.5 p-4 text-center">
                        <Camera className="w-6 h-6 stroke-1 text-stone-300" />
                        <span>No photograph selected yet. Pick a sample leaf above or upload your own.</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      id="btn-run-ai-diagnosis"
                      disabled={!aiLeafPhoto || aiAnalyzing}
                      onClick={handleRunAIDiagnosis}
                      className="w-full h-11 px-5 rounded-xl bg-[#1E4620] hover:bg-[#163719] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {aiAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                          <span>{t('health_diagnosing')}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>{t('health_btn_diagnose')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {aiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* AI DIAGNOSIS RESULT CARD */}
              {aiDiagnosis && (
                <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t('health_diagnosis_result_title')}</span>
                      </span>
                      <span className="text-[11px] font-bold text-stone-500">
                        PlantVillage MobileNetV2
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <SpeechListenButton
                        id="btn-listen-ai-diagnosis"
                        textToSpeak={`AI diagnosis result: ${aiDiagnosis.predicted_class} with ${aiDiagnosis.confidence} confidence. ${aiDiagnosis.general_guidance || ''}`}
                      />

                      <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded ${
                        aiDiagnosis.low_confidence 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : aiDiagnosis.is_healthy 
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}>
                        {aiDiagnosis.low_confidence ? 'Uncertain' : aiDiagnosis.is_healthy ? 'Normal' : 'Pathology Detected'}
                      </span>
                    </div>
                  </div>

                  {/* Icon + predicted_class as the LARGEST element */}
                  <div className="flex items-start gap-3.5 pt-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      aiDiagnosis.low_confidence
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : aiDiagnosis.is_healthy
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                        : 'bg-rose-100 border-rose-300 text-rose-900'
                    }`}>
                      {aiDiagnosis.low_confidence ? (
                        <HelpCircle className="w-7 h-7 stroke-[2.5]" />
                      ) : aiDiagnosis.is_healthy ? (
                        <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                      ) : (
                        <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
                      )}
                    </div>

                    <div>
                      {/* Predicted class is largest element */}
                      <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight" id="ai-diagnosis-predicted-class">
                        {aiDiagnosis.predicted_class}
                      </h2>
                      {/* Confidence as plain text */}
                      <div className="text-xs text-stone-600 font-semibold mt-0.5 flex items-center gap-1.5" id="ai-diagnosis-confidence-text">
                        <span>{t('health_confidence_label')}</span>
                        <span className="font-bold text-stone-900">{aiDiagnosis.confidence}</span>
                        <span>({(aiDiagnosis.confidence_score * 100).toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* General Guidance below */}
                  <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1E4620]" />
                      <span>{t('health_guidance_label')}</span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed font-medium" id="ai-diagnosis-guidance-text">
                      {aiDiagnosis.general_guidance}
                    </p>
                  </div>

                  {/* AI Assessed Distinguishing Note */}
                  <div className="p-2.5 bg-emerald-50/50 border border-emerald-200/50 rounded-xl flex items-start gap-2 text-[11px] text-stone-600">
                    <Info className="w-3.5 h-3.5 shrink-0 text-[#1E4620] mt-0.5" />
                    <span>{t('health_ai_assessed_note')}</span>
                  </div>

                  {/* Save to History Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    {healthSuccessMsg ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('health_saved_ai_success')}</span>
                      </span>
                    ) : <span />}

                    <button
                      type="button"
                      id="btn-save-ai-diagnosis"
                      disabled={savingAiLog}
                      onClick={handleSaveAIDiagnosisToHistory}
                      className="h-10 px-5 rounded-xl bg-[#1E4620] hover:bg-[#163719] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>{savingAiLog ? 'Saving...' : t('health_btn_save_ai_log')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* HEALTH OBSERVATION TIMELINE (Both Manual and AI Tagged Together) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-[#14251B] flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-500" />
              <span>{t('health_history_title')}</span>
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              {healthLogs.length} total check-in {healthLogs.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {loadingHealth ? (
            <div className="p-8 text-center text-xs text-stone-400">Loading history...</div>
          ) : healthLogs.length === 0 ? (
            <div className="bg-[#FBFBF9] border border-stone-200 rounded-2xl p-6 text-center text-xs text-stone-500 font-medium">
              {t('health_history_empty')}
            </div>
          ) : (
            <div className="space-y-2.5">
              {healthLogs.map((log) => {
                const isHealthy = log.health_status === 'Healthy';
                const isOkay = log.health_status === 'Okay';
                const isAi = log.check_in_type === 'ai_diagnosis';

                return (
                  <div
                    key={log._id}
                    className="bg-[#FBFBF9] border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                          isHealthy
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                            : isOkay
                            ? 'bg-amber-100 border-amber-200 text-amber-800'
                            : 'bg-rose-100 border-rose-200 text-rose-800'
                        }`}
                      >
                        {isHealthy ? (
                          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                        ) : isOkay ? (
                          <MinusCircle className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* TYPE BADGE: Manual vs AI Diagnosis */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                              isAi
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            {isAi ? <Sparkles className="w-3 h-3 text-indigo-600" /> : <Edit3 className="w-3 h-3 text-stone-500" />}
                            <span>{isAi ? t('health_tag_ai') : t('health_tag_manual')}</span>
                          </span>

                          {/* HEALTH STATUS BADGE */}
                          <span
                            className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                              isHealthy
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isOkay
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {String(t(`health_status_${log.health_status.toLowerCase()}` as any, log.health_status))}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-500 font-medium">
                              {new Date(log.logged_at || log.date).toLocaleString()}
                            </span>
                            <SpeechListenButton
                              id={`btn-listen-health-log-${log._id || log.id}`}
                              textToSpeak={`Health check-in: ${log.health_status}. Notes: ${log.notes || 'Normal'}.`}
                              variant="compact"
                            />
                          </div>
                        </div>

                        {/* Notes or AI prediction details */}
                        {log.notes && (
                          <p className="text-xs text-stone-700 mt-1.5 leading-relaxed font-normal">
                            "{log.notes}"
                          </p>
                        )}

                        {log.ai_prediction && log.ai_prediction.general_guidance && (
                          <p className="text-[11px] text-stone-500 mt-1 italic">
                            Guidance: {log.ai_prediction.general_guidance}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Optional Thumbnail */}
                    {log.photo_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={log.photo_url}
                          alt="Health check-in"
                          className="w-14 h-14 rounded-xl object-cover border border-stone-200 shadow-2xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>


      {/* Mini Add Crop Cycle Modal */}
      {isCropModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8D5C5] rounded-3xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-stone-800">{t('btn_add_crop')}</h3>
            <form onSubmit={handleAddCropCycle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t('crop_type_label')}</label>
                <input
                  type="text"
                  required
                  id="new-crop-type-input"
                  value={newCropType}
                  onChange={(e) => setNewCropType(e.target.value.toLowerCase())}
                  placeholder="e.g. rice, maize, cotton"
                  className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-[#FBFBF9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t('crop_sowing_date')}</label>
                <input
                  type="date"
                  required
                  id="new-crop-sowing-input"
                  value={newSowingDate}
                  onChange={(e) => setNewSowingDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-[#FBFBF9] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t('crop_harvest_date')}</label>
                <input
                  type="date"
                  required
                  id="new-crop-harvest-input"
                  value={newHarvestDate}
                  onChange={(e) => setNewHarvestDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-[#FBFBF9] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-stone-300 text-xs font-bold text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-new-crop-btn"
                  disabled={addingCrop}
                  className="h-9 px-4 rounded-xl bg-[#1E4620] hover:bg-[#163719] text-white text-xs font-bold"
                >
                  {addingCrop ? 'Saving...' : t('btn_save_crop')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
