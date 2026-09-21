/** A function that speaks text and resolves when playback finishes. */
export type SpeakFn = (text: string) => Promise<void>;

/**
 * Serializes speech so lines are spoken in order without overlap, and drops a
 * line that would immediately repeat the previous one. Engine-agnostic: the
 * actual audio is produced by the injected {@link SpeakFn}.
 */
export class SpeechQueue {
  private readonly queue: string[] = [];
  private running = false;
  private lastEnqueued: string | null = null;

  constructor(private readonly speakFn: SpeakFn) {}

  /** Queue text to be spoken; consecutive duplicates are ignored. */
  enqueue(text: string, force = false): void {
    if (text === '') return;
    if (!force && text === this.lastEnqueued) return;
    this.lastEnqueued = text;
    this.queue.push(text);
    void this.run();
  }

  /** Remove everything not yet spoken. */
  clear(): void {
    this.queue.length = 0;
    this.lastEnqueued = null;
  }

  get pending(): number {
    return this.queue.length;
  }

  private async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.queue.length > 0) {
        const next = this.queue.shift() as string;
        await this.speakFn(next);
      }
    } finally {
      this.running = false;
    }
  }
}
