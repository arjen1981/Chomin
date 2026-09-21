import { describe, it, expect } from 'vitest';
import { similarity, Deduplicator } from './dedup';

describe('similarity', () => {
  it('is 1 for identical text', () => {
    expect(similarity('お前、本当に行くのか？', 'お前、本当に行くのか？')).toBe(1);
  });

  it('is high for minor OCR variation', () => {
    expect(similarity('お前、本当に行くのか？', 'お前 本当に行くのか?')).toBeGreaterThan(
      0.85,
    );
  });

  it('is low for a different line', () => {
    expect(similarity('行くのか？', '街へ戻ろう')).toBeLessThan(0.5);
  });
});

describe('Deduplicator', () => {
  it('processes a new line and suppresses the same line on screen', () => {
    const dedup = new Deduplicator();
    expect(dedup.shouldProcess('お前、本当に行くのか？', 0)).toBe(true);
    // same line, slightly different OCR, a moment later -> duplicate
    expect(dedup.shouldProcess('お前 本当に行くのか?', 500)).toBe(false);
  });

  it('processes a genuinely new line', () => {
    const dedup = new Deduplicator();
    expect(dedup.shouldProcess('行くのか？', 0)).toBe(true);
    expect(dedup.shouldProcess('街へ戻ろう', 100)).toBe(true);
  });

  it('suppresses a re-detected line within the minimum repeat interval', () => {
    const dedup = new Deduplicator({ minRepeatIntervalMs: 4000 });
    expect(dedup.shouldProcess('やあ', 0)).toBe(true);
    expect(dedup.shouldProcess('やあ', 3999)).toBe(false);
  });

  it('allows a line again once the repeat interval elapses', () => {
    const dedup = new Deduplicator({ minRepeatIntervalMs: 4000 });
    expect(dedup.shouldProcess('やあ', 0)).toBe(true);
    expect(dedup.shouldProcess('やあ', 4000)).toBe(true);
  });
});
