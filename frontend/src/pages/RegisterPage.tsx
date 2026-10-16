import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  UserPlus, 
  User as UserIcon, 
  Phone, 
  Lock, 
  MapPin, 
  Globe, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Crosshair,
  Sprout
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { LanguageSelector } from '../components/LanguageSelector.js';
import { SUPPORTED_LANGUAGES } from '../i18n/index.js';

export const RegisterPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick GPS Detection Button
  const handleDetectGPS = () => {
    if ('geolocation' in navigator) {
      setGpsStatus('Acquiring coordinates...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(4));
          const lng = parseFloat(position.coords.longitude.toFixed(4));
          setLatitude(lat);
          setLongitude(lng);
          setGpsStatus(`${lat}, ${lng}`);
        },
        (_err) => {
          const defaultLat = 13.0827;
          const defaultLng = 80.2707;
          setLatitude(defaultLat);
          setLongitude(defaultLng);
          setGpsStatus(`${defaultLat}, ${defaultLng}`);
        },
        { timeout: 5000 }
      );
    } else {
      const defaultLat = 13.0827;
      const defaultLng = 80.2707;
      setLatitude(defaultLat);
      setLongitude(defaultLng);
      setGpsStatus(`${defaultLat}, ${defaultLng}`);
    }
  };

  const handleLanguageSelect = (code: string) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('err_name_required'));
      return;
    }
    if (!phoneNumber.trim()) {
      setError(t('err_phone_invalid'));
      return;
    }
    if (!password || password.length < 6) {
      setError(t('err_password_min'));
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name: name.trim(),
      phone_number: phoneNumber.trim(),
      password,
      preferred_language: selectedLang,
      latitude,
      longitude,
    });
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || t('err_generic'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBFBF9] text-[#14251B] font-sans selection:bg-[#2D6A4F] selection:text-white">
      {/* Top Bar */}
      <header className="h-16 py-2 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-[#E7E5D8] flex-shrink-0">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between gap-4">
          <Link
            to="/"
            id="register-back-home"
            className="h-10 px-3.5 bg-stone-100 hover:bg-stone-200 text-[#14251B] font-semibold text-sm border border-stone-300 rounded-xl flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('link_back_home')}</span>
          </Link>

          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1E4620] text-amber-300 flex items-center justify-center shadow-xs">
              <Sprout className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-lg font-bold text-[#14251B] tracking-tight">{t('brand_name')}</span>
          </Link>

          <LanguageSelector variant="landing" />
        </div>
      </header>

      {/* Main Register Card */}
      <main className="flex-1 flex items-center justify-center p-4 my-4">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-[#D8D5C5] p-6 sm:p-7 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
            <div className="flex items-center gap-2 text-[#1E4620] bg-[#EBF5EE] px-2.5 py-1 rounded-lg border border-[#2D6A4F]/20 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
              <span>{t('status_ready')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('badge_high_contrast')}</span>
            </div>
          </div>

          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-black text-[#14251B] tracking-tight flex items-center gap-2.5">
              <UserPlus className="w-6 h-6 text-[#1E4620]" />
              <span>{t('auth_register_title')}</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600">
              {t('auth_register_sub')}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm font-semibold"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="farmer_name"
                className="block text-xs sm:text-sm font-bold text-stone-800 mb-1 flex items-center gap-1.5"
              >
                <UserIcon className="w-4 h-4 text-[#1E4620]" />
                <span>{t('field_name_label')}</span>
              </label>
              <input
                id="farmer_name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('field_name_placeholder')}
                required
                className="w-full h-11 px-3.5 text-sm sm:text-base font-medium text-[#14251B] bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#1E4620] focus:ring-2 focus:ring-[#1E4620]/20 transition-all placeholder:text-stone-400"
              />
            </div>

            <div>
              <label
                htmlFor="farmer_phone"
                className="block text-xs sm:text-sm font-bold text-stone-800 mb-1 flex items-center gap-1.5"
              >
                <Phone className="w-4 h-4 text-[#1E4620]" />
                <span>{t('field_phone_label')}</span>
              </label>
              <input
                id="farmer_phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('field_phone_placeholder')}
                required
                className="w-full h-11 px-3.5 text-sm sm:text-base font-medium text-[#14251B] bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#1E4620] focus:ring-2 focus:ring-[#1E4620]/20 transition-all placeholder:text-stone-400"
              />
            </div>

            <div>
              <label
                htmlFor="farmer_password"
                className="block text-xs sm:text-sm font-bold text-stone-800 mb-1 flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4 text-[#1E4620]" />
                <span>{t('field_password_label')}</span>
              </label>
              <input
                id="farmer_password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('field_password_placeholder')}
                required
                minLength={6}
                className="w-full h-11 px-3.5 text-sm sm:text-base font-medium text-[#14251B] bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#1E4620] focus:ring-2 focus:ring-[#1E4620]/20 transition-all placeholder:text-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#1E4620]" />
                <span>{t('field_language_label')}</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <button
                      type="button"
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`h-9 px-2 text-xs font-semibold rounded-lg border flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#1E4620] text-white border-[#1E4620] shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span className="truncate">{lang.displayName}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-0.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#1E4620]" />
                <span>{t('field_location_label')}</span>
              </label>
              <p className="text-[11px] text-stone-500 mb-1.5">
                {t('field_location_hint')}
              </p>
              <button
                type="button"
                id="btn-detect-gps"
                onClick={handleDetectGPS}
                className="w-full h-10 px-3 bg-stone-100 hover:bg-stone-200 text-[#14251B] font-semibold text-xs sm:text-sm border border-stone-300 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Crosshair className="w-4 h-4 text-[#1E4620]" />
                <span>{gpsStatus ? `${t('btn_gps_detected')}: ${gpsStatus}` : t('btn_use_gps')}</span>
              </button>
            </div>

            <button
              type="submit"
              id="register-submit-btn"
              disabled={isSubmitting}
              className="w-full h-12 mt-2 px-6 bg-[#1E4620] hover:bg-[#163719] text-white font-bold text-base rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#1E4620] disabled:opacity-60"
            >
              <UserPlus className="w-5 h-5 text-amber-300" />
              <span>{isSubmitting ? t('btn_registering') : t('btn_register_submit')}</span>
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-stone-100 text-center">
            <Link
              to="/login"
              id="link-go-to-login"
              className="text-xs sm:text-sm font-semibold text-[#1E4620] hover:text-[#14251B] underline underline-offset-4"
            >
              {t('link_to_login')}
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-2.5 text-center text-xs text-stone-500 border-t border-[#E7E5D8] bg-white/60 flex-shrink-0">
        © {new Date().getFullYear()} {t('brand_name')} • {t('footer_rights')}
      </footer>
    </div>
  );
};
