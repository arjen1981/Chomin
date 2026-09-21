import { describe, it, expect } from 'vitest';
import { normalizeWhitespace, comparisonKey } from './normalization';

describe('normalizeWhitespace', () => {
  it('collapses runs of whitespace and trims', () => {
    expect(normalizeWhitespace('  お前、\u3000 本当に  行くのか？  ')).toBe(
      'お前、 本当に 行くのか？',
    );
  });

  it('treats full-width and half-width spaces equally', () => {
    expect(normalizeWhitespace('a\u3000b')).toBe(normalizeWhitespace('a b'));
  });
});

describe('comparisonKey', () => {
  it('makes equivalent readings compare equal', () => {
    const a = comparisonKey('お前、本当に行くのか？');
    const b = comparisonKey('お前 本当に行くのか?'); // differing punctuation/space
    expect(a).toBe(b);
  });

  it('normalizes full-width ascii via NFKC', () => {
    expect(comparisonKey('ＨＥＬＬＯ')).toBe('hello');
  });

  it('keeps distinct lines distinct', () => {
    expect(comparisonKey('行くのか？')).not.toBe(comparisonKey('行かないのか？'));
  });
});
