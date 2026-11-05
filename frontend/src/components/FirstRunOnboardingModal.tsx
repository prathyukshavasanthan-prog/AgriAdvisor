import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  MapPin, 
  Check, 
  Compass, 
  Sprout, 
  ArrowRight, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { SOIL_TYPE_BENCHMARKS, LAND_TYPES } from './FarmFormModal.js';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

interface FirstRunOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (farmData: any) => void;
  token?: string | null;
}

const DISTRICT_PRESETS = [
  { name: 'Nagpur, MH', lat: 21.1458, lng: 79.0882, soil: 'black', land: 'irrigated' },
  { name: 'Coimbatore, TN', lat: 11.0168, lng: 76.9558, soil: 'red', land: 'irrigated' },
  { name: 'Mandya, KA', lat: 12.5234, lng: 76.8967, soil: 'red', land: 'lowland_paddy' },
  { name: 'Patna, BR', lat: 25.5941, lng: 85.1376, soil: 'alluvial', land: 'lowland_paddy' },
  { name: 'Rajkot, GJ', lat: 22.3039, lng: 70.8022, soil: 'black', land: 'irrigated' },
  { name: 'Ludhiana, PB', lat: 30.9010, lng: 75.8573, soil: 'alluvial', land: 'irrigated' },
];

const LANGUAGES = [
  { code: 'ta', native: 'தமிழ்', label: 'Tamil' },
  { code: 'hi', native: 'हिन्दी', label: 'Hindi' },
  { code: 'en', native: 'English', label: 'English' },
  { code: 'te', native: 'తెలుగు', label: 'Telugu' },
  { code: 'kn', native: 'ಕನ್ನಡ', label: 'Kannada' },
  { code: 'ml', native: 'മലയാളം', label: 'Malayalam' },
  { code: 'mr', native: 'मराठी', label: 'Marathi' },
  { code: 'bn', native: 'বাংলা', label: 'Bengali' },
  { code: 'gu', native: 'ગુજરાતી', label: 'Gujarati' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', label: 'Punjabi' },
];

export const FirstRunOnboardingModal: React.FC<FirstRunOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  token
}) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const [locationName, setLocationName] = useState('Nagpur, MH');
  const [latitude, setLatitude] = useState<number>(21.1458);
  const [longitude, setLongitude] = useState<number>(79.0882);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [farmName, setFarmName] = useState('My Main Plot');
  const [soilType, setSoilType] = useState('black');
  const [landType, setLandType] = useState('irrigated');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectLanguage = (code: string) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setStep(2);
  };

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsDetecting(false);
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        setLatitude(lat);
        setLongitude(lng);
        setLocationName(`GPS (${lat}, ${lng})`);
        setStep(3);
      },
      (err) => {
        setGpsDetecting(false);
        console.warn('GPS detection denied, falling back to preset:', err.message);
      },
      { timeout: 8000 }
    );
  };

  const handleSelectPreset = (preset: typeof DISTRICT_PRESETS[0]) => {
    setLocationName(preset.name);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setSoilType(preset.soil);
    setLandType(preset.land);
    setStep(3);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const payload = {
        name: farmName || 'My Main Plot',
        latitude,
        longitude,
        soil_type: soilType,
        land_type: landType,
        water_source: 'borewell',
        irrigation_method: 'drip',
        farm_size: 2.5,
        farm_size_unit: 'acres',
        crop: {
          crop_type: 'cotton',
          sowing_date: new Date().toISOString().split('T')[0],
          growth_stage: 'vegetative'
        }
      };

      const res = await fetch(`${API_BASE_URL}/api/farms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      localStorage.setItem('agriadvisor_onboarded', 'true');
      if (res.ok && data.success) {
        onSuccess(data.data);
      } else {
        onSuccess(payload);
      }
      onClose();
    } catch (err) {
      console.error('Onboarding save error:', err);
      localStorage.setItem('agriadvisor_onboarded', 'true');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="first-run-onboarding-modal"
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-[#FBFBF9] border border-stone-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1E4620] text-amber-300 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#14251B] tracking-tight">
                {t('onboard_title', 'Quick Farm Setup')}
              </h2>
              <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
                <span className={step === 1 ? 'text-[#1E4620] underline' : ''}>{t('onboard_step1', '1. Language')}</span>
                <span>•</span>
                <span className={step === 2 ? 'text-[#1E4620] underline' : ''}>{t('onboard_step2', '2. Location')}</span>
                <span>•</span>
                <span className={step === 3 ? 'text-[#1E4620] underline' : ''}>{t('onboard_step3', '3. First Farm')}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            id="btn-close-onboarding"
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: LANGUAGE SELECTION */}
        {step === 1 && (
          <div className="py-5 space-y-4">
            <p className="text-xs sm:text-sm font-semibold text-stone-600">
              Pick your preferred language. All features and voice will adapt instantly.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  id={`onboard-lang-${l.code}`}
                  onClick={() => handleSelectLanguage(l.code)}
                  className={`p-3 rounded-2xl border text-left transition-all min-h-[48px] flex items-center justify-between cursor-pointer ${
                    selectedLang === l.code
                      ? 'bg-[#EBF5EE] border-[#1E4620] ring-2 ring-[#1E4620]/30 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-[#14251B]">{l.native}</div>
                    <div className="text-[11px] text-stone-500">{l.label}</div>
                  </div>
                  {selectedLang === l.code && (
                    <Check className="w-4 h-4 text-[#1E4620]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: ONE-TAP LOCATION */}
        {step === 2 && (
          <div className="py-5 space-y-4">
            <p className="text-xs sm:text-sm font-semibold text-stone-600">
              One tap detects your agro-climatic zone and historical rainfall.
            </p>

            {/* GPS One-Tap Button */}
            <button
              type="button"
              id="onboard-gps-btn"
              onClick={handleGpsDetect}
              disabled={gpsDetecting}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#1E4620] hover:bg-[#163719] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer min-h-[48px]"
            >
              <Compass className={`w-5 h-5 text-amber-300 ${gpsDetecting ? 'animate-spin' : ''}`} />
              <span>{gpsDetecting ? 'Detecting GPS...' : t('onboard_gps_btn', 'Use Current GPS Location')}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-stone-200" />
              <span className="flex-shrink mx-3 text-[11px] font-bold text-stone-400 uppercase">{t('or_tap_district', 'Or tap agricultural district')}</span>
              <div className="flex-grow border-t border-stone-200" />
            </div>

            {/* District Preset Chips */}
            <div className="grid grid-cols-2 gap-2">
              {DISTRICT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  id={`onboard-preset-${preset.name.split(',')[0].toLowerCase()}`}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-2xl border text-left transition-all min-h-[48px] flex items-center justify-between cursor-pointer ${
                    locationName === preset.name
                      ? 'bg-[#EBF5EE] border-[#1E4620] ring-2 ring-[#1E4620]/30 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1E4620]" />
                    <span className="font-bold text-xs text-stone-800">{preset.name}</span>
                  </div>
                  {locationName === preset.name && <Check className="w-3.5 h-3.5 text-[#1E4620]" />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 min-h-[48px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('btn_back', 'Back')}</span>
              </button>
              <button
                type="button"
                id="onboard-step2-next"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center gap-1.5 min-h-[48px]"
              >
                <span>{t('btn_next', 'Next')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FIRST FARM SOIL & LAND SELECTION */}
        {step === 3 && (
          <div className="py-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">
                Farm Name
              </label>
              <input
                type="text"
                id="onboard-farm-name"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-stone-300 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
                placeholder="My Main Plot"
              />
            </div>

            {/* Soil Swatches */}
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1.5">
                Soil Type (Tap to pick)
              </label>
              <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-stone-50 rounded-2xl border border-stone-200">
                {Object.entries(SOIL_TYPE_BENCHMARKS).slice(0, 9).map(([sKey, s]: [string, any]) => (
                  <button
                    key={sKey}
                    type="button"
                    id={`onboard-soil-${sKey}`}
                    onClick={() => setSoilType(sKey)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer min-h-[44px] ${
                      soilType === sKey
                        ? 'bg-white border-[#1E4620] ring-2 ring-[#1E4620]/30 shadow-xs'
                        : 'bg-white/70 border-stone-200 hover:bg-white'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
                      style={{ backgroundColor: s.colorHex }}
                    />
                    <span className="text-[11px] font-bold text-stone-800 truncate">{String(t(s.nameKey, sKey))}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Land Type Icons */}
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1.5">
                Land Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LAND_TYPES.slice(0, 4).map((l: any) => (
                  <button
                    key={l.key}
                    type="button"
                    id={`onboard-land-${l.key}`}
                    onClick={() => setLandType(l.key)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer min-h-[44px] ${
                      landType === l.key
                        ? 'bg-[#EBF5EE] border-[#1E4620] ring-2 ring-[#1E4620]/30 shadow-xs'
                        : 'bg-white border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-stone-800">{String(t(l.labelKey, l.key))}</span>
                    {landType === l.key && <Check className="w-3.5 h-3.5 text-[#1E4620]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 min-h-[48px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('btn_back', 'Back')}</span>
              </button>
              <button
                type="button"
                id="onboard-finish-btn"
                onClick={handleFinish}
                disabled={submitting}
                className="px-5 py-2.5 rounded-2xl bg-[#1E4620] hover:bg-[#163719] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs min-h-[48px] cursor-pointer"
              >
                <Sprout className="w-4 h-4 text-amber-300" />
                <span>{submitting ? 'Saving...' : t('onboard_save_btn', 'Save & Start')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
