/** Options that influence how English text is spoken. */
export interface SpeechOptions {
  /** Playback rate; 1 is normal. Implementations clamp to supported ranges. */
  readonly rate?: number;
  /** Preferred voice identifier (implementation-defined). */
  readonly voiceId?: string;
}

/** A voice that can be selected for speech, where the engine supports it. */
export interface SpeechVoice {
  readonly id: string;
  readonly name: string;
  readonly lang: string;
}

/**
 * Contract for speaking English text aloud. Callers depend only on this
 * interface so the engine (Web Speech today, neural TTS later) is replaceable.
 * Implementations MUST only ever speak English — never the Japanese source.
 */
export interface SpeechService {
  /** Whether speech output is currently enabled. */
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;

  /** Queue English text to be spoken in order, without overlap. */
  speak(english: string, options?: SpeechOptions): void;
  /** Speak the most recently spoken line again. */
  replay(): void;
  /** Stop current speech and clear the queue. */
  cancel(): void;

  /** Available English voices, where the engine exposes them. */
  getVoices(): SpeechVoice[];
  setVoice(voiceId: string): void;
  setRate(rate: number): void;
}
