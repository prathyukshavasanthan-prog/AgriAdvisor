import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { hasVoiceForLanguage, speakText, stopSpeaking } from '../utils/speechUtils.js';

interface SpeechListenButtonProps {
  id?: string;
  textToSpeak: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'compact';
}

export const SpeechListenButton: React.FC<SpeechListenButtonProps> = ({
  id = 'btn-speech-listen',
  textToSpeak,
  className = '',
  variant = 'secondary',
}) => {
  const { t, i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);

  // Re-check voice availability whenever language changes or voices load
  useEffect(() => {
    const checkVoice = () => {
      const avail = hasVoiceForLanguage(i18n.language);
      setVoiceAvailable(avail);
    };

    checkVoice();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = checkVoice;
    }

    return () => {
      stopSpeaking();
    };
  }, [i18n.language]);

  const handleToggleSpeak = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      return;
    }

    if (!voiceAvailable || !textToSpeak) return;

    speakText(
      textToSpeak,
      i18n.language,
      () => setIsPlaying(true),
      () => setIsPlaying(false),
      () => setIsPlaying(false)
    );
  };

  const unavailableMsg = t(
    'voice_unavailable_for_lang',
    'Voice speech is not installed on this device for the selected language.'
  );

  if (!voiceAvailable) {
    return (
      <div className="inline-flex items-center gap-1.5" title={unavailableMsg}>
        <button
          type="button"
          id={id}
          disabled
          aria-disabled="true"
          className={`h-8 px-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-400 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed opacity-70 ${className}`}
        >
          <VolumeX className="w-3.5 h-3.5 text-stone-400" />
          <span>{t('voice_listen_btn', 'Listen')}</span>
        </button>
        <span className="text-[10px] text-stone-400 hidden sm:inline" title={unavailableMsg}>
          ({t('voice_not_supported_short', 'Voice unavailable')})
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      id={id}
      onClick={handleToggleSpeak}
      className={`h-8 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
        isPlaying
          ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
          : variant === 'primary'
          ? 'bg-[#1E4620] hover:bg-[#2D6A4F] text-white'
          : 'bg-[#EBF5EE] hover:bg-[#D5EAD9] text-[#1E4620] border border-[#2D6A4F]/20'
      } ${className}`}
      title={isPlaying ? t('voice_stop_btn', 'Stop') : t('voice_listen_btn', 'Listen')}
      aria-label={isPlaying ? t('voice_stop_btn', 'Stop') : t('voice_listen_btn', 'Listen')}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-3.5 h-3.5" />
          <span>{t('voice_stop_btn', 'Stop')}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
          <span>{t('voice_listen_btn', 'Listen')}</span>
        </>
      )}
    </button>
  );
};
