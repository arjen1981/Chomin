import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSpeechService } from './WebSpeechService';

class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  volume = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function fakeSynth() {
  const spoken: FakeUtterance[] = [];
  return {
    spoken,
    speak: vi.fn((u: FakeUtterance) => {
      spoken.push(u);
      u.onend?.();
    }),
    cancel: vi.fn(),
    getVoices: () => [
      { voiceURI: 'en-1', name: 'English', lang: 'en-US' },
      { voiceURI: 'ja-1', name: 'Japanese', lang: 'ja-JP' },
    ],
  } as unknown as SpeechSynthesis & { spoken: FakeUtterance[] };
}

beforeEach(() => {
  (globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
    FakeUtterance;
});

describe('WebSpeechService', () => {
  it('speaks English text when enabled', () => {
    const synth = fakeSynth();
    const svc = new WebSpeechService(synth);
    svc.speak('Wait!');
    expect(synth.spoken.map((u) => u.text)).toContain('Wait!');
    expect(synth.spoken[0].lang).toBe('en-US');
  });

  it('does not speak when disabled', () => {
    const synth = fakeSynth();
    const svc = new WebSpeechService(synth);
    svc.setEnabled(false);
    svc.speak('Wait!');
    expect(synth.spoken).toHaveLength(0);
  });

  it('exposes only English voices', () => {
    const svc = new WebSpeechService(fakeSynth());
    const voices = svc.getVoices();
    expect(voices).toHaveLength(1);
    expect(voices[0].lang).toBe('en-US');
  });

  it('replays the last spoken line', async () => {
    const synth = fakeSynth();
    const svc = new WebSpeechService(synth);
    svc.speak('Thank you.');
    await Promise.resolve();
    svc.replay();
    await Promise.resolve();
    await Promise.resolve();
    const texts = synth.spoken.map((u) => u.text);
    expect(texts.filter((t) => t === 'Thank you.').length).toBe(2);
  });

  it('unlocks with a non-empty, silent utterance only once', () => {
    const synth = fakeSynth();
    const svc = new WebSpeechService(synth);
    svc.unlock();
    svc.unlock();
    expect(synth.spoken).toHaveLength(1);
    expect(synth.spoken[0].text.length).toBeGreaterThan(0);
    expect(synth.spoken[0].volume).toBe(0);
  });

  it('keeps speaking later lines when the engine never reports the end', async () => {
    vi.useFakeTimers();
    try {
      const synth = fakeSynth();
      (synth.speak as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (u: FakeUtterance) => synth.spoken.push(u), // never fires onend
      );
      const log = vi.fn();
      const svc = new WebSpeechService(synth, log);

      svc.speak('First.');
      svc.speak('Second.');
      expect(synth.spoken.map((u) => u.text)).toEqual(['First.']);

      await vi.advanceTimersByTimeAsync(10_000);

      expect(synth.spoken.map((u) => u.text)).toEqual(['First.', 'Second.']);
      expect(log).toHaveBeenCalledWith(expect.stringContaining('no end event'));
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports speech errors to the diagnostics log', () => {
    const synth = fakeSynth();
    (synth.speak as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (u: FakeUtterance & { onerror: ((e: unknown) => void) | null }) => {
        synth.spoken.push(u);
        u.onerror?.({ error: 'not-allowed' });
      },
    );
    const log = vi.fn();
    new WebSpeechService(synth, log).speak('Wait!');
    expect(log).toHaveBeenCalledWith('speech: error not-allowed');
  });

  it('clamps speech rate to a supported range', () => {
    const synth = fakeSynth();
    const svc = new WebSpeechService(synth);
    svc.setRate(10);
    svc.speak('fast');
    expect(synth.spoken[0].rate).toBe(2);
  });
});
