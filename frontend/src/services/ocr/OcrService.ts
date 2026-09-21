import type { CapturedRegion, OcrResult } from '../../core/types';

/**
 * Contract for turning a captured image region into recognized Japanese text.
 * Callers depend only on this interface, never on a concrete engine.
 */
export interface OcrService {
  recognize(region: CapturedRegion): Promise<OcrResult>;
}
