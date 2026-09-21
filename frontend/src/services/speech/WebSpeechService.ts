import type {
  SpeechOptions,
  SpeechService,
  SpeechVoice,
} from './SpeechService';
import { SpeechQueue } from './SpeechQueue';

/**
 * Web Speech API implementation of {@link SpeechService}. Speaks English only.
 * A single {@link SpeechQueue} guarantees ordered, non-overlapping playback.
 */
export class WebSpeechService implements SpeechService {
  private readonly synth: SpeechSynthesis;
  private readonly queue: SpeechQueue;
  private enabled = true;
  private rate = 1;
  private voiceId: string | null = null;
  private lastSpoken: string | null = null;
  private unlocked = false;

  constructor(synth: SpeechSynthesis = window.speechSynthesis) {
    this.synth = synth;
    this.queue = new SpeechQueue((text) => this.utter(text));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancel();
  }

  /** Must be called from a user gesture once to satisfy iOS audio policy. */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    this.synth.speak(u);
  }

  speak(english: string, options?: SpeechOptions): void {
    if (options?.rate != null) this.rate = options.rate;
    if (options?.voiceId != null) this.voiceId = options.voiceId;
    if (english.trim() === '') return;
    this.lastSpoken = english;
    if (!this.enabled) return;
    this.queue.enqueue(english);
  }

  replay(): void {
    if (this.lastSpoken && this.enabled) {
      this.queue.enqueue(this.lastSpoken, true);
    }
  }

  cancel(): void {
    this.queue.clear();
    this.synth.cancel();
  }

  getVoices(): SpeechVoice[] {
    return this.synth
      .getVoices()
      .filter((v) => v.lang.toLowerCase().startsWith('en'))
      .map((v) => ({ id: v.voiceURI, name: v.name, lang: v.lang }));
  }

  setVoice(voiceId: string): void {
    this.voiceId = voiceId;
  }

  setRate(rate: number): void {
    this.rate = Math.min(2, Math.max(0.5, rate));
  }

  private utter(text: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = this.rate;
      const voice = this.synth
        .getVoices()
        .find((v) => v.voiceURI === this.voiceId);
      if (voice) u.voice = voice;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      this.synth.speak(u);
    });
  }
}
