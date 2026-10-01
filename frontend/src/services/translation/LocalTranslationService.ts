import type { RollingContext, TranslationResult } from '../../core/types';
import type { TranslationService } from './TranslationService';

type Translator = (
  text: string,
) => Promise<Array<{ translation_text: string }>>;

/**
 * On-device Japanese→English translation using the OPUS-MT model via
 * Transformers.js (WASM). Downloaded once, then runs offline. The model is
 * lazy-loaded so tests and startup stay light. No text leaves the device.
 */
export class LocalTranslationService implements TranslationService {
  private translatorPromise: Promise<Translator> | null = null;
  private readonly model: string;

  constructor(model = 'Xenova/opus-mt-ja-en') {
    this.model = model;
  }

  private async ensureTranslator(): Promise<Translator> {
    if (!this.translatorPromise) {
      this.translatorPromise = (async () => {
        const { pipeline } = await import('@huggingface/transformers');
        return (await pipeline('translation', this.model)) as unknown as Translator;
      })();
    }
    return this.translatorPromise;
  }

  /** Begin downloading/initializing the model without translating anything. */
  async warmUp(): Promise<void> {
    await this.ensureTranslator();
  }

  async translate(
    japanese: string,
    _context?: RollingContext,
  ): Promise<TranslationResult> {
    const translator = await this.ensureTranslator();
    const output = await translator(japanese);
    const english = output?.[0]?.translation_text ?? '';
    return { english: english.trim() };
  }
}
