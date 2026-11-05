/**
 * AgriAdvisor Web Speech API Utilities (Speech Synthesis & Recognition)
 * 
 * Supports accessibility across 10 Indian regional languages:
 * en, hi, ta, te, kn, ml, mr, bn, gu, pa.
 * Detects host-installed voices and provides graceful fallback when voice is unavailable.
 */

// Mapping of AgriAdvisor language codes to standard BCP 47 locales
export const LANGUAGE_LOCALE_MAP: Record<string, string[]> = {
  en: ['en-IN', 'en-US', 'en-GB', 'en'],
  hi: ['hi-IN', 'hi'],
  ta: ['ta-IN', 'ta'],
  te: ['te-IN', 'te'],
  kn: ['kn-IN', 'kn'],
  ml: ['ml-IN', 'ml'],
  mr: ['mr-IN', 'mr'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  gu: ['gu-IN', 'gu'],
  pa: ['pa-IN', 'pa'],
};

export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
};

export const getVoiceForLanguage = (langCode: string): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const targetPrefixes = LANGUAGE_LOCALE_MAP[langCode] || [langCode];

  // Try exact match first
  for (const prefix of targetPrefixes) {
    const match = voices.find((v) => v.lang.toLowerCase() === prefix.toLowerCase());
    if (match) return match;
  }

  // Try startsWith match
  for (const prefix of targetPrefixes) {
    const match = voices.find((v) => v.lang.toLowerCase().startsWith(prefix.toLowerCase()));
    if (match) return match;
  }

  return null;
};

export const hasVoiceForLanguage = (langCode: string): boolean => {
  return getVoiceForLanguage(langCode) !== null;
};

export const splitIntoSentences = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(/[^.!?।\n]+[.!?।\n]+|[^.!?।\n]+$/g);
  if (!matches || matches.length === 0) return [text.trim()];
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
};

let currentSpeakingQueue: SpeechSynthesisUtterance[] = [];
let isQueueActive = false;

export const speakText = (
  text: string,
  langCode: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError(new Error('Speech synthesis not supported'));
    return false;
  }

  stopSpeaking();

  const voice = getVoiceForLanguage(langCode);
  if (!voice) {
    if (onError) onError(new Error(`No voice installed on this device for language: ${langCode}`));
    return false;
  }

  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return false;

  isQueueActive = true;
  let currentIndex = 0;

  const speakNext = () => {
    if (!isQueueActive || currentIndex >= sentences.length) {
      isQueueActive = false;
      if (onEnd) onEnd();
      return;
    }

    const sentence = sentences[currentIndex];
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.95; // Slightly slower for clear agrarian comprehension
    utterance.pitch = 1.0;

    if (currentIndex === 0 && onStart) {
      utterance.onstart = () => {
        onStart();
      };
    }

    utterance.onend = () => {
      currentIndex++;
      speakNext();
    };

    utterance.onerror = (e) => {
      isQueueActive = false;
      if (onError) onError(e);
    };

    currentSpeakingQueue.push(utterance);
    window.speechSynthesis.speak(utterance);
  };

  speakNext();
  return true;
};

export const stopSpeaking = (): void => {
  isQueueActive = false;
  currentSpeakingQueue = [];
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
