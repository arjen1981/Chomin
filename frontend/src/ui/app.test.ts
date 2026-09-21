import { describe, it, expect, vi } from 'vitest';
import { mountApp } from './app';
import { MockOcrService } from '../services/ocr/MockOcrService';
import { MockTranslationService } from '../services/translation/MockTranslationService';
import type { AppServices } from '../services/factory';

function fakeSpeech() {
  let enabled = true;
  return {
    isEnabled: () => enabled,
    setEnabled: (v: boolean) => (enabled = v),
    speak: vi.fn(),
    replay: vi.fn(),
    cancel: vi.fn(),
    getVoices: () => [],
    setVoice: vi.fn(),
    setRate: vi.fn(),
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('mountApp', () => {
  it('translates and speaks a manually entered line', async () => {
    const container = document.createElement('div');
    const ocr = new MockOcrService();
    const speech = fakeSpeech();
    const services = {
      ocr,
      translation: new MockTranslationService(),
      speech,
    } as unknown as AppServices;

    mountApp(container, { ocr, services });

    const input = container.querySelector('.manual-input') as HTMLInputElement;
    const translateBtn = Array.from(
      container.querySelectorAll('button.ctrl'),
    ).find((b) => b.textContent === 'Translate') as HTMLButtonElement;

    input.value = 'ありがとう';
    translateBtn.click();
    await flush();

    expect(container.querySelector('.english')!.textContent).toBe('Thank you.');
    expect(speech.speak).toHaveBeenCalledWith('Thank you.');
  });

  it('toggles speech via the control button', () => {
    const container = document.createElement('div');
    const ocr = new MockOcrService();
    const speech = fakeSpeech();
    const services = {
      ocr,
      translation: new MockTranslationService(),
      speech,
    } as unknown as AppServices;

    mountApp(container, { ocr, services });
    const speechBtn = container.querySelector('button.ctrl') as HTMLButtonElement;
    expect(speech.isEnabled()).toBe(true);
    speechBtn.click();
    expect(speech.isEnabled()).toBe(false);
  });
});
