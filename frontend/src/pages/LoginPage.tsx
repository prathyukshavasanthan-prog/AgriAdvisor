import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LogIn, 
  Phone, 
  Lock, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Sprout
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { LanguageSelector } from '../components/LanguageSelector.js';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneNumber.trim()) {
      setError(t('err_phone_invalid'));
      return;
    }
    if (!password) {
      setError(t('err_password_min'));
      return;
    }

    setIsSubmitting(true);
    const result = await login(phoneNumber.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || t('err_generic'));
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col justify-between bg-[#FBFBF9] text-[#14251B] font-sans selection:bg-[#2D6A4F] selection:text-white">
      {/* Compact Top Bar */}
      <header className="h-16 py-2 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-[#E7E5D8] flex-shrink-0">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between gap-4">
          <Link
            to="/"
            id="login-back-home"
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

      {/* Main Login Card — Perfectly Fits 100vh Without Scrolling */}
      <main className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#D8D5C5] p-6 shadow-xl my-auto">
          {/* Status Header: Icon + Text Together */}
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

          {/* Form Header */}
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-black text-[#14251B] tracking-tight flex items-center gap-2.5">
              <LogIn className="w-6 h-6 text-[#1E4620]" />
              <span>{t('auth_login_title')}</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600">
              {t('auth_login_sub')}
            </p>
          </div>

          {/* Error Message with Icon + Text */}
          {error && (
            <div
              role="alert"
              className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm font-semibold"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Number Input */}
            <div>
              <label
                htmlFor="phone_number"
                className="block text-xs sm:text-sm font-bold text-stone-800 mb-1 flex items-center gap-1.5"
              >
                <Phone className="w-4 h-4 text-[#1E4620]" />
                <span>{t('field_phone_label')}</span>
              </label>
              <input
                id="phone_number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('field_phone_placeholder')}
                required
                className="w-full h-11 px-3.5 text-sm sm:text-base font-medium text-[#14251B] bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#1E4620] focus:ring-2 focus:ring-[#1E4620]/20 transition-all placeholder:text-stone-400"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-bold text-stone-800 mb-1 flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4 text-[#1E4620]" />
                <span>{t('field_password_label')}</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('field_password_placeholder')}
                required
                className="w-full h-11 px-3.5 text-sm sm:text-base font-medium text-[#14251B] bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#1E4620] focus:ring-2 focus:ring-[#1E4620]/20 transition-all placeholder:text-stone-400"
              />
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isSubmitting}
              className="w-full h-12 mt-2 px-6 bg-[#1E4620] hover:bg-[#163719] text-white font-bold text-base rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#1E4620] disabled:opacity-60"
            >
              <LogIn className="w-5 h-5 text-amber-300" />
              <span>{isSubmitting ? t('btn_logging_in') : t('btn_login_submit')}</span>
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-4 pt-3 border-t border-stone-100 text-center">
            <Link
              to="/register"
              id="link-go-to-register"
              className="text-xs sm:text-sm font-semibold text-[#1E4620] hover:text-[#14251B] underline underline-offset-4"
            >
              {t('link_to_register')}
            </Link>
          </div>
        </div>
      </main>

      {/* Slim Footer */}
      <footer className="py-2.5 text-center text-xs text-stone-500 border-t border-[#E7E5D8] bg-white/60 flex-shrink-0">
        © {new Date().getFullYear()} {t('brand_name')} • {t('footer_rights')}
      </footer>
    </div>
  );
};
