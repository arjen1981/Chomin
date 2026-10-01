import { describe, it, expect } from 'vitest';
import { StableTextGate } from './stability';

describe('StableTextGate', () => {
  it('accepts text only after it repeats the required number of times', () => {
    const gate = new StableTextGate(2);
    expect(gate.accept('こんにちは')).toBeNull();
    expect(gate.accept('こんにちは')).toBe('こんにちは');
  });

  it('rejects jittery readings that never repeat consecutively', () => {
    const gate = new StableTextGate(2);
    expect(gate.accept('あ')).toBeNull();
    expect(gate.accept('ぃ')).toBeNull();
    expect(gate.accept('う')).toBeNull();
    expect(gate.accept('あ')).toBeNull();
  });

  it('treats punctuation/space variations as the same reading', () => {
    const gate = new StableTextGate(2);
    expect(gate.accept('行くのか？')).toBeNull();
    expect(gate.accept('行くのか')).toBe('行くのか');
  });

  it('treats a minor OCR variation as the same line (fuzzy)', () => {
    const gate = new StableTextGate(3);
    const a = 'どうしても行くのなら私が知らないうちにそっと行ってよ';
    const b = 'どうしても行くのなら私が知らないうちにそつと行ってよ'; // one-char OCR slip
    expect(gate.accept(a)).toBeNull();
    expect(gate.accept(b)).toBeNull();
    expect(gate.accept(a)).toBe(a);
  });

  it('emits a stable line only once while it stays on screen', () => {
    const gate = new StableTextGate(2);
    expect(gate.accept('まて')).toBeNull();
    expect(gate.accept('まて')).toBe('まて');
    expect(gate.accept('まて')).toBeNull();
    expect(gate.accept('まて')).toBeNull();
  });

  it('ignores empty recognitions', () => {
    const gate = new StableTextGate(2);
    expect(gate.accept('')).toBeNull();
    expect(gate.accept('   ')).toBeNull();
  });
});
