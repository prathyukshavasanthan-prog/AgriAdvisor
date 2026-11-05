import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  Send,
  X,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import {
  hasVoiceForLanguage,
  speakText,
  stopSpeaking,
  LANGUAGE_LOCALE_MAP,
} from '../utils/speechUtils.js';

interface FloatingVoiceAssistantProps {
  currentFarmId?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const FloatingVoiceAssistant: React.FC<FloatingVoiceAssistantProps> = ({ currentFarmId }) => {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [spokenText, setSpokenText] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [quickChips, setQuickChips] = useState<string[]>([
    'Should I irrigate today?',
    'Which crop should I grow?',
    'What is the market price?'
  ]);
  const [typedInput, setTypedInput] = useState('');
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [noVoiceBanner, setNoVoiceBanner] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [requiresOfficerContact, setRequiresOfficerContact] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const recognitionRef = useRef<any>(null);

  // Check speech recognition support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setSpeechSupported(hasSpeech);
    }
  }, []);

  // Update voice availability banner when language changes
  useEffect(() => {
    const hasVoice = hasVoiceForLanguage(i18n.language);
    if (!hasVoice && mode === 'speaking') {
      setNoVoiceBanner(true);
      setMode('idle');
    } else {
      setNoVoiceBanner(false);
    }
  }, [i18n.language]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const getLocaleForSpeech = (lang: string): string => {
    const list = LANGUAGE_LOCALE_MAP[lang];
    return list && list.length > 0 ? list[0] : `${lang}-IN`;
  };

  const handleStartListening = () => {
    if (mode === 'speaking') {
      stopSpeaking();
    }

    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setIsOpen(true);
      return;
    }

    setIsOpen(true);
    setMicPermissionDenied(false);

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = getLocaleForSpeech(i18n.language);
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setMode('listening');
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setRetryCount(0);
        processQuestion(text);
      };

      recognition.onerror = (event: any) => {
        console.warn('[Voice Assistant] Speech Recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setMicPermissionDenied(true);
          setMode('idle');
        } else if (event.error === 'no-speech') {
          if (retryCount === 0) {
            setRetryCount(1);
            try {
              recognition.start();
            } catch (e) {
              setMode('idle');
            }
          } else {
            setMode('idle');
          }
        } else {
          setMode('idle');
        }
      };

      recognition.onend = () => {
        if (mode === 'listening') {
          setTimeout(() => {
            setMode((prev) => (prev === 'listening' ? 'idle' : prev));
          }, 300);
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('[Voice Assistant] Failed to start recognition:', err);
      setMode('idle');
    }
  };

  const handleStopAll = () => {
    stopSpeaking();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }
    setMode('idle');
  };

  const processQuestion = async (queryText: string) => {
    if (!queryText || !queryText.trim()) return;

    setMode('thinking');
    setAnswer(null);
    setTopic(null);
    setRequiresOfficerContact(false);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/assistant/ask`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: queryText,
          lang: i18n.language,
          farmId: currentFarmId,
          page: window.location.pathname,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAnswer(data.answer);
        setSpokenText(data.spokenText || data.answer);
        setTopic(data.topic || 'AgriAdvisor Guidance');
        if (data.quickChips && Array.isArray(data.quickChips) && data.quickChips.length > 0) {
          setQuickChips(data.quickChips);
        }
        setRequiresOfficerContact(!!data.requiresOfficerContact);

        // Speech playback
        const hasVoice = hasVoiceForLanguage(i18n.language);
        if (hasVoice) {
          setNoVoiceBanner(false);
          setMode('speaking');
          speakText(
            data.spokenText || data.answer,
            i18n.language,
            () => setMode('speaking'),
            () => setMode('idle'),
            () => {
              setMode('idle');
              setNoVoiceBanner(true);
            }
          );
        } else {
          setNoVoiceBanner(true);
          setMode('idle');
        }
      } else {
        setAnswer(
          t('voice_error_fallback', 'Please check your connection or choose from the quick questions below.')
        );
        setMode('idle');
      }
    } catch (err) {
      console.warn('[Voice Assistant] Ask API error:', err);
      setAnswer(
        t('voice_error_fallback', 'Please check your connection or choose from the quick questions below.')
      );
      setMode('idle');
    }
  };

  const handleChipClick = (chipText: string) => {
    setTranscript(chipText);
    processQuestion(chipText);
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const text = typedInput.trim();
    setTranscript(text);
    setTypedInput('');
    processQuestion(text);
  };

  return (
    <>
      {/* Floating Trigger Button (Always visible on all screens) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {mode === 'speaking' && (
          <button
            type="button"
            id="btn-voice-stop"
            onClick={handleStopAll}
            className="h-12 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all animate-pulse cursor-pointer"
            title={t('voice_btn_stop', 'Stop Speaking')}
          >
            <Square className="w-4 h-4 fill-white" />
            <span>{t('voice_btn_stop', 'Stop')}</span>
          </button>
        )}

        <button
          type="button"
          id="btn-floating-voice-mic"
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              handleStartListening();
            } else {
              if (mode === 'listening') {
                handleStopAll();
              } else {
                handleStartListening();
              }
            }
          }}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer border-2 ${
            mode === 'listening'
              ? 'bg-rose-600 border-rose-300 text-white scale-110 animate-bounce'
              : mode === 'thinking'
              ? 'bg-amber-600 border-amber-300 text-white animate-pulse'
              : mode === 'speaking'
              ? 'bg-blue-600 border-blue-300 text-white scale-105'
              : 'bg-[#1E4620] hover:bg-[#2D6A4F] border-[#52B788] text-white hover:scale-105'
          }`}
          title={
            mode === 'listening'
              ? t('voice_state_listening', 'Listening... speak now')
              : mode === 'thinking'
              ? t('voice_state_thinking', 'Thinking...')
              : mode === 'speaking'
              ? t('voice_state_speaking', 'Speaking answer...')
              : t('voice_btn_speak', 'Push to Talk')
          }
          aria-label={t('voice_assistant_title', 'Voice Assistant')}
        >
          {mode === 'listening' ? (
            <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
          ) : mode === 'thinking' ? (
            <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
          ) : mode === 'speaking' ? (
            <Volume2 className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
          ) : (
            <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
          )}
        </button>
      </div>

      {/* Slide-out / Modal Interactive Assistant Panel */}
      {isOpen && (
        <div
          id="voice-panel"
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[80vh] flex flex-col bg-white border border-[#D8D5C5] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Panel Header */}
          <div className="p-4 bg-[#1E4620] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight leading-none">
                  {t('voice_assistant_title', 'AgriAdvisor Assistant')}
                </h4>
                <span className="text-[10px] text-emerald-200 uppercase font-semibold">
                  {mode === 'listening'
                    ? t('voice_state_listening', 'Listening...')
                    : mode === 'thinking'
                    ? t('voice_state_thinking', 'Thinking...')
                    : mode === 'speaking'
                    ? t('voice_state_speaking', 'Speaking...')
                    : t('voice_state_idle', 'Push mic or tap below')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {mode !== 'idle' && (
                <button
                  type="button"
                  id="btn-voice-panel-stop"
                  onClick={handleStopAll}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title={t('voice_btn_stop', 'Stop')}
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                </button>
              )}
              <button
                type="button"
                id="btn-voice-close"
                onClick={() => {
                  handleStopAll();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title={t('voice_close_btn', 'Close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
            {/* Banner: Browser lacks speech recognition */}
            {!speechSupported && (
              <div
                id="voice-banner-unsupported"
                className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2"
              >
                <MicOff className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight font-medium">
                  {t('voice_unsupported', 'Speech recognition is not supported in this browser. Please use the typed input box below.')}
                </span>
              </div>
            )}

            {/* Banner: No installed voice on host machine */}
            {noVoiceBanner && (
              <div
                id="voice-banner-no-voice"
                className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2"
              >
                <VolumeX className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold block">
                    {t('voice_banner_no_voice', 'Voice speech is not installed on this device for the selected language.')}
                  </span>
                  <span>{t('voice_text_displayed', 'Text answer displayed below.')}</span>
                </div>
              </div>
            )}

            {/* Banner: Microphone permission denied */}
            {micPermissionDenied && (
              <div
                id="voice-banner-mic-denied"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5"
              >
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <MicOff className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{t('voice_mic_blocked', 'Microphone Access Blocked')}</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-tight">
                  {t(
                    'voice_banner_mic_denied',
                    'Microphone permission denied. To enable: Click lock icon in browser URL bar -> Site settings -> Allow Microphone.'
                  )}
                </p>
              </div>
            )}

            {/* Transcript (What farmer said) */}
            {transcript && (
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  {t('voice_transcript_label', 'You Asked')}
                </span>
                <p id="voice-transcript-text" className="text-xs font-bold text-stone-800">
                  "{transcript}"
                </p>
              </div>
            )}

            {/* Answer Display */}
            {answer && (
              <div
                id="voice-answer-container"
                className="p-3.5 rounded-2xl bg-[#EBF5EE] border border-[#2D6A4F]/20 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E4620]">
                    {topic || t('voice_answer_label', 'AgriAdvisor Guidance')}
                  </span>
                  {spokenText && hasVoiceForLanguage(i18n.language) && (
                    <button
                      type="button"
                      id="btn-voice-replay"
                      onClick={() => {
                        stopSpeaking();
                        speakText(
                          spokenText,
                          i18n.language,
                          () => setMode('speaking'),
                          () => setMode('idle'),
                          () => setMode('idle')
                        );
                      }}
                      className="p-1 rounded-md bg-white hover:bg-stone-100 text-[#1E4620] transition shadow-2xs cursor-pointer"
                      title="Replay Voice"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p
                  id="voice-answer-text"
                  className="text-xs sm:text-sm font-bold text-[#14251B] leading-relaxed"
                >
                  {answer}
                </p>

                {requiresOfficerContact && (
                  <div className="p-2 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 text-[11px] font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                    <span>
                      {t(
                        'voice_officer_contact_note',
                        'Please contact your local agriculture extension officer (KVK) for certified advice.'
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Question Chips */}
            <div id="voice-quick-chips" className="space-y-1.5">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                {t('voice_quick_chips_label', 'Quick Questions')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-[#FBFBF9] hover:bg-[#EBF5EE] hover:border-[#2D6A4F]/30 text-stone-700 hover:text-[#1E4620] text-[11px] font-bold transition cursor-pointer shadow-2xs text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Typed Fallback Input Box */}
            <form onSubmit={handleTypedSubmit} className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                id="voice-typed-input"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder={t('voice_typed_placeholder', 'Or type your question here...')}
                className="flex-1 h-9 px-3 rounded-xl border border-stone-300 bg-stone-50 text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4620]/30"
              />
              <button
                type="submit"
                id="voice-submit-btn"
                disabled={!typedInput.trim() || mode === 'thinking'}
                className="h-9 px-3 rounded-xl bg-[#1E4620] hover:bg-[#2D6A4F] text-white text-xs font-bold flex items-center gap-1 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('voice_send_btn', 'Ask')}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
