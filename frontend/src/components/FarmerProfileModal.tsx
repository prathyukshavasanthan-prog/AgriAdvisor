import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Phone, 
  Globe, 
  MapPin, 
  X, 
  Edit3, 
  Check, 
  Sprout, 
  Droplet,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { SUPPORTED_LANGUAGES } from '../i18n/index.js';

interface FarmerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FarmerProfileModal: React.FC<FarmerProfileModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { user, syncLanguage } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedLang, setSelectedLang] = useState(user?.preferred_language || i18n.language || 'en');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (selectedLang !== i18n.language) {
      await syncLanguage(selectedLang);
    }
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#1E4620] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <User className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">{t('profile_modal_title')}</h2>
              <p className="text-xs text-emerald-100">{t('profile_modal_sub')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('profile_btn_close')}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {saveSuccess && (
            <div className="p-3 bg-[#EBF5EE] text-[#1E4620] border border-[#2D6A4F]/20 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2D6A4F] flex-shrink-0" />
              <span>{t('profile_updated_alert')}</span>
            </div>
          )}

          {/* Primary Identity Card */}
          <div className="p-4 bg-[#FBFBF9] rounded-xl border border-stone-200 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1E4620] text-amber-300 flex items-center justify-center text-xl font-bold shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-[#14251B] truncate">{user?.name || 'Registered Cultivator'}</div>
              <div className="text-xs text-stone-600 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span className="font-mono">{user?.phone_number || 'N/A'}</span>
              </div>
              <div className="text-xs text-stone-600 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span className="truncate">{user?.latitude && user?.longitude ? `${user.latitude}, ${user.longitude}` : '13.0827, 80.2707'}</span>
              </div>
            </div>
          </div>

          {/* Editable Field Preferences */}
          <div className="space-y-3 pt-2">
            {/* Preferred Language */}
            <div className="p-3.5 bg-white rounded-xl border border-stone-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#1E4620]" />
                  <span>{t('field_language_label')}</span>
                </label>
                {!isEditing && (
                  <span className="text-xs font-bold text-[#1E4620] bg-[#EBF5EE] px-2 py-0.5 rounded">
                    {SUPPORTED_LANGUAGES.find((l) => l.code === (user?.preferred_language || i18n.language))?.displayName}
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      type="button"
                      key={lang.code}
                      onClick={() => setSelectedLang(lang.code)}
                      className={`h-8 px-2 text-xs font-semibold rounded-lg border text-left flex items-center justify-between transition-colors ${
                        selectedLang === lang.code
                          ? 'bg-[#1E4620] text-white border-[#1E4620]'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span className="truncate">{lang.displayName}</span>
                      {selectedLang === lang.code && <Check className="w-3 h-3 text-amber-300" />}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Farm Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#1E4620]" />
                  <span>{t('profile_field_land')}</span>
                </div>
                <div className="text-sm font-bold text-[#14251B] mt-1">{t('profile_field_land_val')}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-[#1E4620]" />
                  <span>{t('profile_field_crop')}</span>
                </div>
                <div className="text-sm font-bold text-[#14251B] mt-1 truncate">{t('profile_field_crop_val')}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5 text-[#1E4620]" />
                  <span>{t('profile_field_irrigation')}</span>
                </div>
                <div className="text-sm font-bold text-[#14251B] mt-1 truncate">{t('profile_field_irrigation_val')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="h-10 px-4 text-xs sm:text-sm font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-xl transition-colors"
              >
                {t('profile_btn_close')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="h-10 px-5 text-xs sm:text-sm font-bold text-white bg-[#1E4620] hover:bg-[#163719] rounded-xl flex items-center gap-2 shadow-xs transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{t('profile_btn_save')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 text-xs sm:text-sm font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-xl transition-colors"
              >
                {t('profile_btn_close')}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="h-10 px-5 text-xs sm:text-sm font-bold text-[#14251B] bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center gap-2 shadow-xs transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>{t('profile_btn_edit')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
