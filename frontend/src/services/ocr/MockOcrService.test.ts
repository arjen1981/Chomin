import { describe, it, expect } from 'vitest';
import { MockOcrService } from './MockOcrService';
import type { CapturedRegion } from '../../core/types';

function region(): CapturedRegion {
  return {
    image: { width: 1, height: 1, data: new Uint8ClampedArray(4) },
    capturedAt: 0,
  };
}

describe('MockOcrService', () => {
  it('returns text and a confidence', async () => {
    const ocr = new MockOcrService();
    ocr.setText('お前、本当に行くのか？');
    const result = await ocr.recognize(region());
    expect(result.text).toBe('お前、本当に行くのか？');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('normalizes whitespace before returning', async () => {
    const ocr = new MockOcrService();
    ocr.setText('  お前、\u3000 本当に  行くのか？  ');
    const result = await ocr.recognize(region());
    expect(result.text).toBe('お前、 本当に 行くのか？');
  });

  it('returns empty text with zero confidence when nothing is recognized', async () => {
    const ocr = new MockOcrService();
    ocr.setText('');
    const result = await ocr.recognize(region());
    expect(result.text).toBe('');
    expect(result.confidence).toBe(0);
  });
});
