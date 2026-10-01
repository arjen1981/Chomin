import type { PrivacyMode } from './core/types';
import { DEFAULT_DEDUP_CONFIG, type DeduplicatorConfig } from './core/dedup';

/** Application configuration resolved at the composition root. */
export interface AppConfig {
  /** Privacy mode; defaults to the most private working mode. */
  mode: PrivacyMode;
  /** Optional backend translation endpoint (used only in Cloud mode). */
  backendEndpoint?: string;
  /** Frame sampling interval in milliseconds. */
  samplingIntervalMs: number;
  /** Minimum OCR confidence (0..1) before a recognition is considered. */
  minOcrConfidence: number;
  /** Consecutive similar OCR reads required before accepting a line. */
  ocrStabilityFrames: number;
  /** Deduplication tuning. */
  dedup: DeduplicatorConfig;
}

export const DEFAULT_CONFIG: AppConfig = {
  mode: 'local',
  samplingIntervalMs: 500,
  minOcrConfidence: 0.35,
  ocrStabilityFrames: 3,
  dedup: DEFAULT_DEDUP_CONFIG,
};
