import { describe, it, expect, vi } from 'vitest';
import type { CapturedRegion } from '../../core/types';
import type { TWorker } from './TesseractOcrService';

// jsdom has no 2D canvas; preprocessing is covered by preprocess.test.ts.
vi.mock('./preprocess', () => ({
  preprocessForOcr: () => document.createElement('canvas'),
}));

const { TesseractOcrService } = await import('./TesseractOcrService');

function region(): CapturedRegion {
  return { image: { width: 2, height: 2, data: new Uint8ClampedArray(16) }, capturedAt: 0 };
}

function fakeWorker(text: string, confidence: number) {
  const worker: TWorker = {
    setParameters: vi.fn(async () => undefined),
    recognize: vi.fn(async () => ({ data: { text, confidence } })),
  };
  return worker;
}

describe('TesseractOcrService', () => {
  it('returns text with whitespace stripped and confidence in 0..1', async () => {
    const worker = fakeWorker('お 前 、\n本 当 に 行 く の か ？\n', 87);
    const ocr = new TesseractOcrService(async () => worker);

    const result = await ocr.recognize(region());

    expect(result.text).toBe('お前、本当に行くのか？');
    expect(result.confidence).toBeCloseTo(0.87);
  });

  it('creates the Japanese worker once and reuses it', async () => {
    const worker = fakeWorker('やあ', 90);
    const factory = vi.fn(async () => worker);
    const ocr = new TesseractOcrService(factory);

    await ocr.recognize(region());
    await ocr.recognize(region());

    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledWith('jpn');
    expect(worker.setParameters).toHaveBeenCalledWith({ tessedit_pageseg_mode: '3' });
    expect(worker.recognize).toHaveBeenCalledTimes(2);
  });

  it('returns empty text with zero confidence when nothing is recognized', async () => {
    const ocr = new TesseractOcrService(async () => fakeWorker('', 0));

    const result = await ocr.recognize(region());

    expect(result).toEqual({ text: '', confidence: 0 });
  });

  it('exposes the preprocessed image for the debug view', async () => {
    const ocr = new TesseractOcrService(async () => fakeWorker('やあ', 90));

    await ocr.recognize(region());

    expect(ocr.debugImage).toBeInstanceOf(HTMLCanvasElement);
  });
});
