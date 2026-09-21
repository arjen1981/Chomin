import type { RollingContext, TranslationResult } from '../../core/types';
import { comparisonKey } from '../../core/normalization';
import type { TranslationService } from './TranslationService';

/**
 * MVP local translation. Real on-device translation is deferred; this uses a
 * small built-in dictionary of sample RPG lines with an English-only fallback,
 * so Local mode can demonstrate the pipeline with no network. It preserves the
 * {@link TranslationService} contract for a future local model to satisfy.
 */
export class MockTranslationService implements TranslationService {
  private readonly dictionary: Map<string, string>;
  private readonly fallback: string;

  constructor(
    options: {
      entries?: Record<string, string>;
      fallback?: string;
    } = {},
  ) {
    const entries = {
      ...DEFAULT_ENTRIES,
      ...(options.entries ?? {}),
    };
    this.dictionary = new Map(
      Object.entries(entries).map(([ja, en]) => [comparisonKey(ja), en]),
    );
    this.fallback = options.fallback ?? '(no local translation available)';
  }

  async translate(
    japanese: string,
    _context?: RollingContext,
  ): Promise<TranslationResult> {
    const english = this.dictionary.get(comparisonKey(japanese)) ?? this.fallback;
    return { english };
  }
}

const DEFAULT_ENTRIES: Record<string, string> = {
  'お前、本当に行くのか？': 'You... are you really going?',
  '街へ戻ろう': "Let's head back to town.",
  'まて！': 'Wait!',
  'ありがとう': 'Thank you.',
};
