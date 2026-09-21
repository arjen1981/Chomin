import type { CapturedRegion, OcrResult } from '../../core/types';
import { normalizeWhitespace } from '../../core/normalization';
import type { OcrService } from './OcrService';

/**
 * MVP OCR implementation. Real on-device OCR is deferred; this returns text
 * supplied manually (or via a provider), normalized, so the end-to-end
 * pipeline can be demonstrated behind the {@link OcrService} contract.
 */
export class MockOcrService implements OcrService {
  private provider: (region: CapturedRegion) => string | null;
  private confidence: number;

  constructor(
    options: {
      provider?: (region: CapturedRegion) => string | null;
      confidence?: number;
    } = {},
  ) {
    this.provider = options.provider ?? (() => null);
    this.confidence = options.confidence ?? 0.9;
  }

  /** Supply the next line of text the pipeline should "recognize". */
  setText(text: string | null): void {
    this.provider = () => text;
  }

  async recognize(region: CapturedRegion): Promise<OcrResult> {
    const raw = this.provider(region);
    if (raw == null || raw.trim() === '') {
      return { text: '', confidence: 0 };
    }
    return { text: normalizeWhitespace(raw), confidence: this.confidence };
  }
}
