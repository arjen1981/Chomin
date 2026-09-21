import { describe, it, expect, vi } from 'vitest';
import { createServices } from './factory';
import { DEFAULT_CONFIG } from '../config';
import { MockTranslationService } from './translation/MockTranslationService';
import { BackendTranslationService } from './translation/BackendTranslationService';

const fakeSynth = {
  getVoices: () => [],
  speak: vi.fn(),
  cancel: vi.fn(),
} as unknown as SpeechSynthesis;

describe('createServices (composition root)', () => {
  it('resolves each service from config', () => {
    const services = createServices(DEFAULT_CONFIG, { synth: fakeSynth });
    expect(typeof services.ocr.recognize).toBe('function');
    expect(typeof services.translation.translate).toBe('function');
    expect(typeof services.speech.speak).toBe('function');
  });

  it('uses local translation in Local mode', () => {
    const services = createServices(
      { ...DEFAULT_CONFIG, mode: 'local' },
      { synth: fakeSynth },
    );
    expect(services.translation).toBeInstanceOf(MockTranslationService);
  });

  it('uses the backend translation in Cloud mode when an endpoint is set', () => {
    const services = createServices(
      { ...DEFAULT_CONFIG, mode: 'cloud', backendEndpoint: '/api/translate' },
      { synth: fakeSynth, fetch: vi.fn() },
    );
    expect(services.translation).toBeInstanceOf(BackendTranslationService);
  });

  it('falls back to local translation in Cloud mode without an endpoint', () => {
    const services = createServices(
      { ...DEFAULT_CONFIG, mode: 'cloud' },
      { synth: fakeSynth },
    );
    expect(services.translation).toBeInstanceOf(MockTranslationService);
  });
});
