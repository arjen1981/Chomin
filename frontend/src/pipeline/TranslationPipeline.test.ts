import { describe, it, expect, vi } from 'vitest';
import { TranslationPipeline } from './TranslationPipeline';
import type { AppServices } from '../services/factory';
import type { CapturedRegion, OcrResult, ProcessingState } from '../core/types';

function region(): CapturedRegion {
  return { image: { width: 1, height: 1, data: new Uint8ClampedArray(4) }, capturedAt: 0 };
}

function fakeServices(ocrText: string) {
  const ocr = { recognize: vi.fn(async (): Promise<OcrResult> => ({ text: ocrText, confidence: 0.9 })) };
  const translation = { translate: vi.fn(async (ja: string) => ({ english: `EN:${ja}` })) };
  const speech = {
    isEnabled: () => true,
    setEnabled: vi.fn(),
    speak: vi.fn(),
    replay: vi.fn(),
    cancel: vi.fn(),
    getVoices: () => [],
    setVoice: vi.fn(),
    setRate: vi.fn(),
  };
  return { services: { ocr, translation, speech } as unknown as AppServices, ocr, translation, speech };
}

describe('TranslationPipeline', () => {
  it('runs the end-to-end path for a new line', async () => {
    const f = fakeServices('お前、本当に行くのか？');
    const pipeline = new TranslationPipeline(f.services);
    const dialogue: string[] = [];
    pipeline.onDialogue((l) => dialogue.push(l.english));

    const outcome = await pipeline.processRegion(region(), 0);

    expect(outcome.status).toBe('translated');
    expect(outcome.english).toBe('EN:お前、本当に行くのか？');
    expect(f.translation.translate).toHaveBeenCalledTimes(1);
    expect(f.speech.speak).toHaveBeenCalledWith('EN:お前、本当に行くのか？');
    expect(dialogue).toEqual(['EN:お前、本当に行くのか？']);
  });

  it('short-circuits a duplicate line (no re-translate, no re-speak)', async () => {
    const f = fakeServices('やあ');
    const pipeline = new TranslationPipeline(f.services);

    await pipeline.processRegion(region(), 0);
    const second = await pipeline.processRegion(region(), 100);

    expect(second.status).toBe('duplicate');
    expect(f.translation.translate).toHaveBeenCalledTimes(1);
    expect(f.speech.speak).toHaveBeenCalledTimes(1);
  });

  it('returns empty when OCR finds nothing', async () => {
    const f = fakeServices('   ');
    const pipeline = new TranslationPipeline(f.services);
    const outcome = await pipeline.processRegion(region(), 0);
    expect(outcome.status).toBe('empty');
    expect(f.translation.translate).not.toHaveBeenCalled();
  });

  it('exposes state transitions the UI can observe', async () => {
    const f = fakeServices('ありがとう');
    const pipeline = new TranslationPipeline(f.services);
    const states: ProcessingState[] = [];
    pipeline.onState((s) => states.push(s));

    await pipeline.processRegion(region(), 0);

    expect(states).toEqual(['recognizing', 'translating', 'speaking', 'idle']);
    expect(pipeline.getState()).toBe('idle');
  });
});
