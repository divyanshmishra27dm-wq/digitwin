/**
 * Speech Voice Manager: Text-to-Speech (TTS) for Digital Twins
 * Optimized for natural, human-like cadence, speed, and real-time interruption (barge-in)
 */

let voicesCache = [];

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const list = window.speechSynthesis.getVoices();
  if (list && list.length > 0) {
    voicesCache = list;
  }
  return voicesCache;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };
  }
}

/**
 * Clean text for natural human conversational speech:
 * Strips markdown symbols, asterisks, headers, bullets, emojis, brackets,
 * and inserts natural conversational pauses.
 */
export function sanitizeForSpeech(raw = '') {
  if (!raw) return '';
  return raw
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_~]+/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/--/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find the most natural human voice available in the user's browser/OS.
 * Prioritizes Enhanced, Natural, Premium, and Google neural voices.
 */
function findBestVoice(candidates, preferredNames = [], gender = 'any') {
  if (!candidates || candidates.length === 0) return null;

  // 1. First priority: Enhanced / Natural / Premium versions of preferred names
  for (const name of preferredNames) {
    const match = candidates.find(
      (v) =>
        new RegExp(name, 'i').test(v.name) &&
        /enhanced|natural|premium|neural/i.test(v.name)
    );
    if (match) return match;
  }

  // 2. Second priority: Standard version of preferred names
  for (const name of preferredNames) {
    const match = candidates.find((v) => new RegExp(name, 'i').test(v.name));
    if (match) return match;
  }

  // 3. Third priority: Any Enhanced or Google voice matching gender
  const enhanced = candidates.filter((v) =>
    /enhanced|natural|google|neural|siri/i.test(v.name)
  );
  if (gender === 'female') {
    const fem = enhanced.find((v) => /female|samantha|karen|victoria|zira/i.test(v.name));
    if (fem) return fem;
  } else if (gender === 'male') {
    const mal = enhanced.find((v) => /male|daniel|alex|george|david/i.test(v.name));
    if (mal) return mal;
  }
  if (enhanced.length > 0) return enhanced[0];

  // Fallback
  return candidates[0] || null;
}

/**
 * Determine best available browser voice and pitch/rate per twin persona
 * Configured with human conversational tempo (1.18x - 1.25x) instead of sluggish 1.0x
 */
export function getTwinVoiceConfig(twin, speedMultiplier = 1.0) {
  const voices = loadVoices();
  const name = (twin?.name || '').toLowerCase();

  // Filter English voices
  const enVoices = voices.filter((v) => v.lang.startsWith('en'));
  const candidatePool = enVoices.length > 0 ? enVoices : voices;

  let selectedVoice = null;
  let pitch = 1.0;
  // Human conversational tempo is naturally 1.18x - 1.24x in Web Speech
  let baseRate = 1.22;

  if (name.includes('divyansh')) {
    // Energetic, confident natural male voice (prefers Rishi, Daniel, Alex, Oliver, Google UK Male)
    selectedVoice = findBestVoice(candidatePool, ['rishi', 'daniel', 'alex', 'oliver', 'google uk english male', 'george'], 'male');
    pitch = 1.04;
    baseRate = 1.24;
  } else if (name.includes('aarav')) {
    // Deep, authoritative, measured male voice (prefers Daniel, Alex, Rishi, Fred)
    selectedVoice = findBestVoice(candidatePool, ['alex', 'daniel', 'rishi', 'fred', 'google us english'], 'male');
    pitch = 0.86;
    baseRate = 1.16;
  } else if (name.includes('pooja')) {
    // Articulate, warm, engaging female voice (prefers Samantha, Karen, Victoria, Veena)
    selectedVoice = findBestVoice(candidatePool, ['samantha', 'karen', 'victoria', 'veena', 'google uk english female'], 'female');
    pitch = 1.08;
    baseRate = 1.22;
  } else if (name.includes('sneha')) {
    // Calm, analytical, focused female voice (prefers Moira, Fiona, Tessa, Samantha)
    selectedVoice = findBestVoice(candidatePool, ['moira', 'fiona', 'tessa', 'samantha', 'google us english'], 'female');
    pitch = 0.98;
    baseRate = 1.19;
  } else if (name.includes('ashok') || name.includes('vikram') || name.includes('amit')) {
    // Senior banking advisor / RM male voice
    selectedVoice = findBestVoice(candidatePool, ['rishi', 'alex', 'daniel', 'google us english'], 'male');
    pitch = 0.96;
    baseRate = 1.20;
  } else if (name.includes('kavita')) {
    // Banking operations manager female voice
    selectedVoice = findBestVoice(candidatePool, ['veena', 'samantha', 'karen', 'victoria'], 'female');
    pitch = 1.05;
    baseRate = 1.21;
  } else {
    // Deterministic assignment for other twins
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    const abs = Math.abs(hash);
    if (candidatePool.length > 0) {
      selectedVoice = candidatePool[abs % candidatePool.length];
    }
    pitch = 0.94 + ((abs % 20) / 100);
    baseRate = 1.20;
  }

  const finalRate = Math.min(2.0, Math.max(0.7, baseRate * (speedMultiplier || 1.0)));

  return {
    voice: selectedVoice,
    pitch,
    rate: finalRate,
  };
}

class SpeechVoiceManager {
  constructor() {
    this.currentUtterance = null;
    this.isAudioMuted = false;
    this.volume = 1.0;
    this.speedMultiplier = 1.0;
    this.currentText = '';
    this.lastCharIndex = 0;
  }

  /**
   * Speak a phrase as a specific Digital Twin with human cadence and boundary tracking
   */
  speak({ text, twin, onStart, onEnd, onError, onBoundary }) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onEnd?.();
      return;
    }

    this.stop();

    if (this.isAudioMuted) {
      onEnd?.();
      return;
    }

    const cleanText = sanitizeForSpeech(text);
    if (!cleanText) {
      onEnd?.();
      return;
    }

    this.currentText = cleanText;
    this.lastCharIndex = 0;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const config = getTwinVoiceConfig(twin, this.speedMultiplier);

    if (config.voice) {
      utterance.voice = config.voice;
    }
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    utterance.volume = this.volume;

    utterance.onstart = () => {
      onStart?.();
    };

    // Track word boundaries in real-time so we know what was said if interrupted
    utterance.onboundary = (event) => {
      if (typeof event.charIndex === 'number') {
        this.lastCharIndex = event.charIndex;
        const spokenSnippet = this.currentText.slice(0, event.charIndex + (event.charLength || 10)).trim();
        onBoundary?.(spokenSnippet, event.charIndex);
      }
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.currentText = '';
      this.lastCharIndex = 0;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('[speechVoiceManager] Speech error:', e);
      }
      this.currentUtterance = null;
      this.currentText = '';
      this.lastCharIndex = 0;
      onError?.(e);
      onEnd?.();
    };

    this.currentUtterance = utterance;

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[speechVoiceManager] speak() failed:', err);
      onEnd?.();
    }
  }

  /**
   * Get what has been spoken so far before an interruption
   */
  getSpokenSnippet() {
    if (!this.currentText) return '';
    if (this.lastCharIndex > 0) {
      return this.currentText.slice(0, Math.min(this.currentText.length, this.lastCharIndex + 25)).trim();
    }
    return this.currentText.slice(0, 80).trim();
  }

  /**
   * Stop any current twin speech immediately (barge-in / interrupt)
   */
  stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        // ignore
      }
    }
    this.currentUtterance = null;
  }

  /**
   * Check if speech is currently active
   */
  isSpeaking() {
    return !!(
      typeof window !== 'undefined' &&
      window.speechSynthesis &&
      (window.speechSynthesis.speaking || this.currentUtterance)
    );
  }

  setMuted(muted) {
    this.isAudioMuted = !!muted;
    if (this.isAudioMuted) {
      this.stop();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setSpeedMultiplier(mult) {
    this.speedMultiplier = Math.max(0.7, Math.min(2.0, mult));
  }
}

export const speechVoiceManager = new SpeechVoiceManager();
export default speechVoiceManager;
