import { comparisonKey } from './normalization';

/** Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Similarity in 0..1 (1 = identical) over normalized comparison keys. */
export function similarity(a: string, b: string): number {
  const ka = comparisonKey(a);
  const kb = comparisonKey(b);
  if (ka.length === 0 && kb.length === 0) return 1;
  const maxLen = Math.max(ka.length, kb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(ka, kb) / maxLen;
}

export interface DeduplicatorConfig {
  /** Minimum similarity (0..1) to treat two lines as the same line. */
  readonly threshold: number;
  /** Number of recent distinct lines to remember. */
  readonly historySize: number;
  /** Minimum time before an already-processed line may be processed again. */
  readonly minRepeatIntervalMs: number;
}

export const DEFAULT_DEDUP_CONFIG: DeduplicatorConfig = {
  threshold: 0.85,
  historySize: 8,
  minRepeatIntervalMs: 4000,
};

interface HistoryEntry {
  text: string;
  processedAt: number;
}

/**
 * Suppresses redundant work: a line equivalent to a recently processed line is
 * a duplicate until {@link DeduplicatorConfig.minRepeatIntervalMs} has elapsed.
 */
export class Deduplicator {
  private readonly history: HistoryEntry[] = [];
  private readonly config: DeduplicatorConfig;

  constructor(config: Partial<DeduplicatorConfig> = {}) {
    this.config = { ...DEFAULT_DEDUP_CONFIG, ...config };
  }

  /**
   * Decide whether `text` should be processed now. When it should, the line is
   * recorded so subsequent equivalent detections are suppressed.
   */
  shouldProcess(text: string, now: number = Date.now()): boolean {
    const match = this.findMatch(text);
    if (match) {
      if (now - match.processedAt < this.config.minRepeatIntervalMs) {
        return false; // duplicate within the repeat interval
      }
      match.text = text;
      match.processedAt = now;
      this.promote(match);
      return true;
    }
    this.record(text, now);
    return true;
  }

  private findMatch(text: string): HistoryEntry | undefined {
    let best: HistoryEntry | undefined;
    let bestScore = 0;
    for (const entry of this.history) {
      const score = similarity(text, entry.text);
      if (score >= this.config.threshold && score > bestScore) {
        best = entry;
        bestScore = score;
      }
    }
    return best;
  }

  private record(text: string, now: number): void {
    this.history.push({ text, processedAt: now });
    while (this.history.length > this.config.historySize) this.history.shift();
  }

  private promote(entry: HistoryEntry): void {
    const idx = this.history.indexOf(entry);
    if (idx >= 0) {
      this.history.splice(idx, 1);
      this.history.push(entry);
    }
  }
}
