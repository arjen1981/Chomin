import { describe, it, expect } from 'vitest';
import { SpeechQueue } from './SpeechQueue';

/** Deterministic fake speaker that records order and resolves on demand. */
function makeSpeaker() {
  const spoken: string[] = [];
  let release: (() => void) | null = null;
  const speak = (text: string) =>
    new Promise<void>((resolve) => {
      spoken.push(text);
      release = () => resolve();
    });
  return { spoken, speak, step: () => release?.() };
}

describe('SpeechQueue', () => {
  it('speaks lines one at a time in order', async () => {
    const s = makeSpeaker();
    const q = new SpeechQueue(s.speak);
    q.enqueue('one');
    q.enqueue('two');
    q.enqueue('three');

    expect(s.spoken).toEqual(['one']); // only the first has started
    s.step();
    await Promise.resolve();
    await Promise.resolve();
    expect(s.spoken).toEqual(['one', 'two']);
    s.step();
    await Promise.resolve();
    await Promise.resolve();
    expect(s.spoken).toEqual(['one', 'two', 'three']);
  });

  it('drops a consecutive duplicate line', async () => {
    const s = makeSpeaker();
    const q = new SpeechQueue(s.speak);
    q.enqueue('hello');
    q.enqueue('hello');
    expect(q.pending).toBe(0); // second dropped; first already dequeued
    expect(s.spoken).toEqual(['hello']);
  });

  it('allows the same line again after a different line', async () => {
    const s = makeSpeaker();
    const q = new SpeechQueue(s.speak);
    q.enqueue('a');
    q.enqueue('b');
    q.enqueue('a');
    // a is speaking; b and a queued
    expect(q.pending).toBe(2);
  });
});
