// Nimbo Voice Engine: Expressive Neural Audio with Web Speech API Fallback

let currentAudio: HTMLAudioElement | null = null;
let isAudioMuted = false;

// Pre-generated high-fidelity Edge Neural Voice clips
const AUDIO_MAP: Record<string, string> = {
  'Yuk, susun piring sehat bergizi seimbang!': '/audio/nimbo/intro.mp3',
  'Pilih 1 karbohidrat dan 1 lauk protein!': '/audio/nimbo/round-1.mp3',
  'Pilih 1 porsi sayuran untuk piringmu!': '/audio/nimbo/round-2.mp3',
  'Pilih 1 buah segar yang manis alami!': '/audio/nimbo/round-3.mp3',
  'Piringmu lengkap! Yuk jawab 2 kuis kilat ini.': '/audio/nimbo/quiz-intro.mp3',
  'Pilih makanan lain untuk piringmu.': '/audio/nimbo/remove-food.mp3',
};

// Check mute state from localStorage
if (typeof window !== 'undefined') {
  try {
    isAudioMuted = localStorage.getItem('playlab_voice_muted') === 'true';
  } catch {
    // Ignore storage errors
  }
}

export function isNimboVoiceMuted(): boolean {
  return isAudioMuted;
}

export function toggleNimboVoiceMute(): boolean {
  isAudioMuted = !isAudioMuted;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('playlab_voice_muted', String(isAudioMuted));
    } catch {
      // Ignore storage errors
    }
    if (isAudioMuted) {
      stopNimboVoice();
    }
  }
  return isAudioMuted;
}

export function stopNimboVoice(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // Ignore
    }
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

/**
 * Play expressive speech for Nimbo.
 * Prefers pre-rendered ultra-natural neural MP3s; smoothly falls back to
 * Web Speech API with cheerful character pitch modulation (1.25).
 */
export function speakNimbo(
  text: string,
  options?: {
    audioKey?: string;
    onStart?: () => void;
    onEnd?: () => void;
  }
): void {
  if (isAudioMuted || typeof window === 'undefined') return;

  stopNimboVoice();

  // 1. Resolve pre-rendered neural voice clip URL
  let audioUrl: string | undefined = undefined;
  if (options?.audioKey) {
    audioUrl = `/audio/nimbo/${options.audioKey}.mp3`;
  } else if (AUDIO_MAP[text]) {
    audioUrl = AUDIO_MAP[text];
  }

  if (audioUrl) {
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    audio.onplay = () => {
      options?.onStart?.();
    };

    audio.onended = () => {
      currentAudio = null;
      options?.onEnd?.();
    };

    audio.onerror = () => {
      // If MP3 fails to load, gracefully fallback to tuned speech synthesis
      currentAudio = null;
      speakWithWebSpeech(text, options?.onStart, options?.onEnd);
    };

    audio.play().catch(() => {
      // Autoplay blocked or gesture required
      speakWithWebSpeech(text, options?.onStart, options?.onEnd);
    });
    return;
  }

  // 2. Fallback to Web Speech API with cheerful Nimbo voice tuning
  speakWithWebSpeech(text, options?.onStart, options?.onEnd);
}

function speakWithWebSpeech(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';

    // Character tuning: lively, cheerful cartoon pitch for Nimbo
    utterance.pitch = 1.25;
    utterance.rate = 1.0;

    // Pick best available Indonesian voice
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('id') ||
        v.name.toLowerCase().includes('indonesia')
    );
    if (idVoice) {
      utterance.voice = idVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}
