/**
 * Speech Recognition Manager: User Voice Input (STT)
 * Uses Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 */

class SpeechRecognitionManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.silenceTimer = null;
    this.currentTranscript = '';
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      null;

    if (!SpeechRecognition) return;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    } catch (err) {
      console.warn('[speechRecognitionManager] Init error:', err);
    }
  }

  isSupported() {
    return !!(
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }

  /**
   * Start listening to user voice via microphone
   */
  startListening({ onInterim, onFinal, onSilence, onError, silenceDelay = 1800 }) {
    if (!this.recognition) {
      this.init();
      if (!this.recognition) {
        onError?.(new Error('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari, or type in the call chat.'));
        return;
      }
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.currentTranscript = '';
    clearTimeout(this.silenceTimer);

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0]?.transcript || '';
        if (item.isFinal) {
          final += text + ' ';
        } else {
          interim += text;
        }
      }

      if (final) {
        this.currentTranscript += (this.currentTranscript ? ' ' : '') + final.trim();
        onFinal?.(this.currentTranscript);
      }

      const activeText = (this.currentTranscript + (interim ? ' ' + interim : '')).trim();
      onInterim?.(activeText);

      // Reset silence timer whenever user speaks
      clearTimeout(this.silenceTimer);
      if (activeText.length > 3) {
        this.silenceTimer = setTimeout(() => {
          if (this.currentTranscript.trim()) {
            onSilence?.(this.currentTranscript.trim());
            this.currentTranscript = '';
          }
        }, silenceDelay);
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Normal silence timeout
        return;
      }
      if (event.error === 'aborted') {
        return;
      }
      console.warn('[speechRecognitionManager] Error:', event.error);
      onError?.(event);
    };

    this.recognition.onend = () => {
      // If still marked as listening (e.g. continuous mode reset), restart
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (err) {
          this.isListening = false;
        }
      } else {
        this.isListening = false;
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (err) {
      console.warn('[speechRecognitionManager] start() failed:', err);
      onError?.(err);
    }
  }

  /**
   * Stop microphone voice recognition
   */
  stopListening() {
    clearTimeout(this.silenceTimer);
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        // ignore
      }
    }
  }

  getCurrentTranscript() {
    return this.currentTranscript;
  }

  clearTranscript() {
    this.currentTranscript = '';
    clearTimeout(this.silenceTimer);
  }
}

export const speechRecognitionManager = new SpeechRecognitionManager();
export default speechRecognitionManager;
