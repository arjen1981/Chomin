import { describe, it, expect } from 'vitest';
import { RollingContextBuffer } from '../src/core/context';

describe('RollingContextBuffer', () => {
  it('keeps only the most recent N lines', () => {
    const buf = new RollingContextBuffer(2);
    buf.add({ japanese: 'a', english: 'a' });
    buf.add({ japanese: 'b', english: 'b' });
    buf.add({ japanese: 'c', english: 'c' });
    const snap = buf.snapshot();
    expect(snap.recentLines.map((l) => l.english)).toEqual(['b', 'c']);
  });

  it('exposes known terms', () => {
    const buf = new RollingContextBuffer();
    buf.addTerm('勇者', 'Hero');
    expect(buf.snapshot().terms['勇者']).toBe('Hero');
  });

  it('produces an immutable snapshot', () => {
    const buf = new RollingContextBuffer();
    buf.add({ japanese: 'x', english: 'x' });
    const snap = buf.snapshot();
    buf.add({ japanese: 'y', english: 'y' });
    expect(snap.recentLines).toHaveLength(1);
  });
});
