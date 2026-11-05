import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';

interface LanguageSelectorProps {
  variant?: 'landing' | 'dashboard';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'landing' }) => {
  const { i18n, t } = useTranslation();
  const { syncLanguage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[1]; // default English if not matched

  const handleSelectLanguage = (code: string) => {
    syncLanguage(code);
    setIsOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'dashboard') {
    // High-contrast, large touch-target design system for Dashboard / Auth
    return (
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          type="button"
          id="language-selector-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={t('nav_language')}
          className="min-h-[48px] px-4 py-2 bg-slate-900 text-white font-semibold text-base border-2 border-black rounded-lg flex items-center justify-between gap-3 shadow-[3px_3px_0px_#000000] hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-400 active:translate-x-[1px] active:translate-y-[1px]"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400 stroke-[2.5]" />
            <span className="text-base font-bold tracking-wide">
              {i18n.language === 'en' ? currentLang.displayName : currentLang.nativeName}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-amber-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-black rounded-lg shadow-[5px_5px_0px_#000000] z-50 overflow-hidden py-1 max-h-96 overflow-y-auto">
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('nav_language')} (10)
            </div>
            {SUPPORTED_LANGUAGES.map((lang, idx) => {
              const isSelected = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`lang-option-${lang.code}`}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full text-left px-4 py-3 min-h-[48px] flex items-center justify-between text-base font-medium transition-colors border-b border-slate-100 last:border-b-0 ${
                    isSelected
                      ? 'bg-amber-100 text-slate-950 font-bold border-l-4 border-l-slate-900'
                      : 'text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-6 text-xs text-slate-500 font-mono font-bold">
                      {idx + 1}.
                    </span>
                    <span className="text-base">{i18n.language === 'en' ? lang.displayName : lang.nativeName}</span>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-slate-950 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Landing page style: refined, elegant cream/green aesthetic
  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        id="landing-language-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={t('nav_language')}
        className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#1E4620] bg-white/90 hover:bg-white border border-[#1E4620]/20 rounded-full shadow-sm hover:shadow transition-all backdrop-blur-sm"
      >
        <Globe className="w-4 h-4 text-[#2D6A4F]" />
        <span className="font-semibold">
          {i18n.language === 'en' ? currentLang.displayName : currentLang.nativeName}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1 max-h-80 overflow-y-auto divide-y divide-stone-100">
          <div className="px-4 py-2 bg-stone-50 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            {t('nav_language')} (10)
          </div>
          {SUPPORTED_LANGUAGES.map((lang, idx) => {
            const isSelected = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                id={`landing-lang-${lang.code}`}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-sm transition-colors ${
                  isSelected
                    ? 'bg-[#EBF5EE] text-[#1E4620] font-bold'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-stone-400 font-mono">{idx + 1}.</span>
                  <span>{i18n.language === 'en' ? lang.displayName : lang.nativeName}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#2D6A4F]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
