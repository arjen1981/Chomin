/**
 * Shared, framework-agnostic types for the translation pipeline.
 * Nothing here may depend on the DOM, a UI framework, or a concrete engine.
 */

/** A captured image region handed to the OCR stage. */
export interface CapturedRegion {
  /** Raw pixel data of the region of interest. */
  readonly image: ImageLike;
  /** Timestamp (ms epoch) the region was captured. */
  readonly capturedAt: number;
}

/**
 * Minimal image contract so core logic stays independent of the DOM.
 * Browser code supplies an ImageData; tests can supply a plain object.
 */
export interface ImageLike {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

/** Result returned by any OCR implementation. */
export interface OcrResult {
  /** Recognized Japanese text (may be empty). */
  readonly text: string;
  /** Confidence in the range 0..1. */
  readonly confidence: number;
}

/** Result returned by any translation implementation. */
export interface TranslationResult {
  /** Natural English dialogue, and nothing else. */
  readonly english: string;
}

/** Optional rolling context supplied to the translation stage. */
export interface RollingContext {
  /** Most-recent-last list of previously translated lines. */
  readonly recentLines: readonly DialogueLine[];
  /** Known terminology / name mappings (Japanese -> English). */
  readonly terms: Readonly<Record<string, string>>;
}

/** A single dialogue line as it moves through the pipeline. */
export interface DialogueLine {
  readonly japanese: string;
  readonly english: string;
}

/** Coarse processing state the UI can render as an indicator. */
export type ProcessingState =
  | 'idle'
  | 'recognizing'
  | 'translating'
  | 'speaking';

/** Privacy mode governing whether camera-derived data may leave the device. */
export type PrivacyMode = 'local' | 'cloud';
