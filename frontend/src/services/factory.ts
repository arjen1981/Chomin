import type { AppConfig } from '../config';
import type { OcrService } from './ocr/OcrService';
import type { TranslationService } from './translation/TranslationService';
import type { SpeechService } from './speech/SpeechService';
import { MockOcrService } from './ocr/MockOcrService';
import { MockTranslationService } from './translation/MockTranslationService';
import { BackendTranslationService } from './translation/BackendTranslationService';
import { WebSpeechService } from './speech/WebSpeechService';

export interface AppServices {
  readonly ocr: OcrService;
  readonly translation: TranslationService;
  readonly speech: SpeechService;
}

export interface ServiceOverrides {
  ocr?: OcrService;
  translation?: TranslationService;
  speech?: SpeechService;
  fetch?: typeof fetch;
  synth?: SpeechSynthesis;
}

/**
 * Composition root: selects concrete service implementations from config.
 * Callers receive only the abstract contracts, so engines are replaceable.
 * Cloud-mode translation is chosen only when the user selected Cloud mode
 * and a backend endpoint is configured; otherwise everything stays local.
 */
export function createServices(
  config: AppConfig,
  overrides: ServiceOverrides = {},
): AppServices {
  const ocr = overrides.ocr ?? new MockOcrService();

  const translation =
    overrides.translation ?? createTranslationService(config, overrides.fetch);

  const speech =
    overrides.speech ??
    new WebSpeechService(overrides.synth ?? globalThis.speechSynthesis);

  return { ocr, translation, speech };
}

function createTranslationService(
  config: AppConfig,
  fetchImpl?: typeof fetch,
): TranslationService {
  if (config.mode === 'cloud' && config.backendEndpoint) {
    return new BackendTranslationService(config.backendEndpoint, fetchImpl);
  }
  return new MockTranslationService();
}
