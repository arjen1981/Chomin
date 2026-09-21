/**
 * Rate limiter that decides when the next frame may be submitted for
 * processing, so downstream OCR runs no faster than the configured interval
 * regardless of the preview's frame rate.
 */
export class FrameSampler {
  private lastSampleAt = Number.NEGATIVE_INFINITY;

  constructor(private intervalMs: number) {}

  setInterval(intervalMs: number): void {
    this.intervalMs = Math.max(0, intervalMs);
  }

  /** Returns true (and records the time) when a sample is allowed at `now`. */
  maybeSample(now: number): boolean {
    if (now - this.lastSampleAt >= this.intervalMs) {
      this.lastSampleAt = now;
      return true;
    }
    return false;
  }

  reset(): void {
    this.lastSampleAt = Number.NEGATIVE_INFINITY;
  }
}
