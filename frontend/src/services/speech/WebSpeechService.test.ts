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

  it('clamps speech rate to a supported range', () => {
    const synth = fakeSynth();
    const svc = new WebSpeechService(synth);
    svc.setRate(10);
    svc.speak('fast');
    expect(synth.spoken[0].rate).toBe(2);
  });
});
