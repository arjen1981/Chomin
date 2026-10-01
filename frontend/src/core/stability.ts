import { comparisonKey } from './normalization';
import { similarity } from './dedup';

/**
 * Filters OCR jitter: only emits a line after several *similar* reads in a row,
 * and emits it once (not every frame), so small per-frame OCR variation of the
 * same on-screen line does not produce a stream of slightly different lines.
 */
export class StableTextGate {
  private candidate: string | null = null;
  private count = 0;
  private emitted = false;

  constructor(
    private readonly required = 3,
    private readonly simThreshold = 0.8,
  ) {}

  /** Returns the stabilized text once, when it has settled; otherwise null. */
  accept(text: string): string | null {
    if (comparisonKey(text) === '') {
      this.reset();
      return null;
    }
    if (
      this.candidate !== null &&
      similarity(text, this.candidate) >= this.simThreshold
    ) {
      this.count += 1;
      this.candidate = text; // track the most recent similar reading
    } else {
      this.candidate = text;
      this.count = 1;
      this.emitted = false;
    }
    if (this.count >= this.required && !this.emitted) {
      this.emitted = true;
      return this.candidate;
    }
    return null;
  }

  reset(): void {
    this.candidate = null;
    this.count = 0;
    this.emitted = false;
  }
}
