import type { CapturedRegion, OcrResult } from '../../core/types';
import type { OcrService } from './OcrService';
import { preprocessForOcr } from './preprocess';

export type TWorker = {
  setParameters(params: Record<string, string>): Promise<unknown>;
  recognize(image: HTMLCanvasElement): Promise<{ data: { text: string; confidence: number } }>;
};

/** Creates a Tesseract worker for the given language; injectable for tests. */
export type WorkerFactory = (lang: string) => Promise<TWorker>;

/**
 * Same-origin asset paths (copied from node_modules by
 * scripts/copy-tesseract-assets.mjs) so OCR never fetches from a CDN and the
 * service worker can cache it for offline use.
 */
function assetBase(): string {
  return `${import.meta.env.BASE_URL}tesseract`;
}

const defaultWorkerFactory: WorkerFactory = async (lang) => {
  const { createWorker } = await import('tesseract.js');
  const base = assetBase();
  return (await createWorker(lang, undefined, {
    workerPath: `${base}/worker.min.js`,
    corePath: `${base}/core`,
    langPath: `${base}/lang`,
  })) as unknown as TWorker;
};

/**
 * On-device Japanese OCR via Tesseract.js (WASM). The engine and its language
 * data are lazy-loaded on first use so tests and startup stay light. No image
 * ever leaves the device.
 */
export class TesseractOcrService implements OcrService {
  private workerPromise: Promise<TWorker> | null = null;
  /** Last preprocessed image, exposed for an on-screen debug preview. */
  debugImage: HTMLCanvasElement | null = null;

  constructor(private readonly createWorker: WorkerFactory = defaultWorkerFactory) {}

  private async ensureWorker(): Promise<TWorker> {
    if (!this.workerPromise) {
      this.workerPromise = (async () => {
        const worker = await this.createWorker('jpn');
        // Auto page segmentation handles a dialogue block within empty space.
        await worker.setParameters({ tessedit_pageseg_mode: '3' });
        return worker;
      })();
    }
    return this.workerPromise;
  }

  async recognize(region: CapturedRegion): Promise<OcrResult> {
    const canvas = preprocessForOcr(region.image);
    this.debugImage = canvas;
    const worker = await this.ensureWorker();
    const { data } = await worker.recognize(canvas);
    // Japanese has no word spaces; Tesseract inserts them, so strip whitespace.
    const text = (data.text ?? '').replace(/\s+/gu, '').trim();
    return { text, confidence: (data.confidence ?? 0) / 100 };
  }
}
