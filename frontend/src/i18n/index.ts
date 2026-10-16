import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ta from './locales/ta.json';
import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import mr from './locales/mr.json';
import bn from './locales/bn.json';
import gu from './locales/gu.json';
import pa from './locales/pa.json';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  displayName: string;
}

// Exactly these 10 languages, in this exact order, each shown in native script
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', displayName: 'Tamil (தமிழ்)' },
  { code: 'en', name: 'English', nativeName: 'English', displayName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', displayName: 'Hindi (हिंदी)' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', displayName: 'Telugu (తెలుగు)' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', displayName: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', displayName: 'Malayalam (മലയാളം)' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', displayName: 'Marathi (मराठी)' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', displayName: 'Bengali (বাংলা)' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', displayName: 'Gujarati (ગુજરાતી)' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', displayName: 'Punjabi (ਪੰਜਾਬੀ)' },
];

export const resources = {
  ta: { translation: ta },
  en: { translation: en },
  hi: { translation: hi },
  te: { translation: te },
  kn: { translation: kn },
  ml: { translation: ml },
  mr: { translation: mr },
  bn: { translation: bn },
  gu: { translation: gu },
  pa: { translation: pa },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

export default i18n;
