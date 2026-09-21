import type { RollingContext, TranslationResult } from '../../core/types';

/**
 * Contract for translating Japanese dialogue into natural English.
 * Callers depend only on this interface, never on a concrete engine
 * (cloud API, ONNX model, or local LLM).
 */
export interface TranslationService {
  translate(
    japanese: string,
    context?: RollingContext,
  ): Promise<TranslationResult>;
}
