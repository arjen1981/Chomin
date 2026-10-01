import type { AppConfig } from '../config';
import { DEFAULT_CONFIG } from '../config';
import type { AppServices } from '../services/factory';
import type { OcrService } from '../services/ocr/OcrService';
import type { TranslationService } from '../services/translation/TranslationService';
import { TesseractOcrService } from '../services/ocr/TesseractOcrService';
import { LocalTranslationService } from '../services/translation/LocalTranslationService';
import { BackendTranslationService } from '../services/translation/BackendTranslationService';
import { WebSpeechService } from '../services/speech/WebSpeechService';
import { PrivacyController } from '../privacy/PrivacyController';
import { TranslationPipeline } from '../pipeline/TranslationPipeline';
import { startCamera, stopCamera, captureRegion, CameraUnavailableError } from '../camera/camera';
import { FrameSampler } from '../camera/frameSampler';
import { DEFAULT_ROI, displayToFrameRoi, type Roi } from '../camera/roi';
import { StableTextGate } from '../core/stability';
import type { PrivacyMode } from '../core/types';
import { createView, type View } from './view';

export interface MountOverrides {
  config?: AppConfig;
  controller?: PrivacyController;
  ocr?: OcrService;
  services?: AppServices;
}

/** Bootstrap the application: build services, view, and start the camera loop. */
export function mountApp(root: HTMLElement, overrides: MountOverrides = {}): void {
  const config: AppConfig = { ...DEFAULT_CONFIG, ...overrides.config };
  const controller =
    overrides.controller ?? new PrivacyController(config.mode, globalThis.fetch);

  const overrideServices = overrides.services;
  // Real, on-device services by default; overrides let tests inject fakes.
  const speech =
    overrideServices?.speech ??
    new WebSpeechService(globalThis.speechSynthesis, (msg) => view.setSpeechDebug(msg));
  const ocr: OcrService =
    overrideServices?.ocr ?? overrides.ocr ?? new TesseractOcrService();

  let services: AppServices =
    overrideServices ?? { ocr, translation: buildTranslation(), speech };
  let pipeline = new TranslationPipeline(services);

  // ROI as positioned over the preview (fractions of the preview box).
  let roi: Roi = DEFAULT_ROI;

  const view: View = createView({
    onToggleSpeech: () => {
      const next = !services.speech.isEnabled();
      services.speech.setEnabled(next);
      view.setSpeechEnabled(next);
    },
    onReplay: () => services.speech.replay(),
    onRate: (rate) => services.speech.setRate(rate),
    onVoice: (voiceId) => services.speech.setVoice(voiceId),
    onModeChange: (mode) => handleModeChange(mode),
    onManualSubmit: (text) => runManual(text),
    onAcknowledgeCloud: () => {
      controller.acknowledgeCloud();
      applyMode('cloud');
      view.hideDisclosure();
    },
    onDeclineCloud: () => {
      applyMode('local');
      view.hideDisclosure();
    },
    onRoiChange: (next) => (roi = next),
  });
  root.replaceChildren(view.root);

  wirePipeline();
  view.setMode(config.mode);
  view.setSpeechEnabled(services.speech.isEnabled());
  refreshVoices();

  controller.onDisclosureNeeded(() => view.showDisclosure());
  maybeWarmUp();

  // iOS requires a user gesture to unlock audio; do it once on first tap.
  // Safari only counts touchend/click as activation (not pointerdown).
  const unlockOnce = () => {
    if (services.speech instanceof WebSpeechService) services.speech.unlock();
    root.removeEventListener('touchend', unlockOnce);
    root.removeEventListener('click', unlockOnce);
  };
  root.addEventListener('touchend', unlockOnce);
  root.addEventListener('click', unlockOnce);

  // Safari/Chrome load voices asynchronously; refresh the list when ready.
  globalThis.speechSynthesis?.addEventListener?.('voiceschanged', () => refreshVoices());

  function buildTranslation(): TranslationService {
    if (overrideServices) return overrideServices.translation;
    if (config.mode === 'cloud' && config.backendEndpoint) {
      return new BackendTranslationService(
        config.backendEndpoint,
        controller.guardedFetch,
      );
    }
    return new LocalTranslationService();
  }

  function maybeWarmUp(): void {
    const t = services.translation as Partial<{ warmUp(): Promise<void> }>;
    if (typeof t.warmUp === 'function') {
      view.setEnglish('Loading translation model… (first time only)');
      t.warmUp()
        .then(() => view.setEnglish(''))
        .catch(() => view.setEnglish('Could not load the translation model.'));
    }
  }

  function wirePipeline(): void {
    pipeline.onState((s) => view.setProcessing(s));
    pipeline.onDialogue((line) => {
      view.setJapanese(line.japanese);
      view.setEnglish(line.english);
    });
  }

  function rebuildServices(): void {
    services = { ocr, translation: buildTranslation(), speech };
    pipeline = new TranslationPipeline(services);
    wirePipeline();
    view.setSpeechEnabled(services.speech.isEnabled());
    refreshVoices();
    maybeWarmUp();
  }

  function applyMode(mode: PrivacyMode): void {
    config.mode = mode;
    controller.setMode(mode);
    view.setMode(mode);
    rebuildServices();
  }

  function handleModeChange(mode: PrivacyMode): void {
    if (mode === 'cloud' && !controller.isCloudAcknowledged()) {
      view.setMode('local'); // keep private until confirmed
      view.showDisclosure();
      return;
    }
    applyMode(mode);
  }

  function refreshVoices(): void {
    view.setVoices(services.speech.getVoices());
  }

  function runManual(text: string): void {
    pipeline.processText(text).catch((err) => reportError(view, err));
  }

  startCameraLoop(view, config, ocr, () => pipeline, () => roi).catch((err) => {
    if (err instanceof CameraUnavailableError) {
      view.showCameraError(cameraMessage(err));
    }
  });
}

/** Surface a pipeline failure (e.g. translation model error) instead of failing silently. */
function reportError(view: View, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  view.setProcessing('idle');
  view.setSpeechDebug(`pipeline error: ${message}`);
}

function cameraMessage(err: CameraUnavailableError): string {
  switch (err.reason) {
    case 'denied':
      return 'Camera access was denied. Enable it in Settings, or type dialogue below.';
    case 'notfound':
      return 'No camera found. You can still type dialogue below.';
    case 'unsupported':
      return 'This browser cannot access the camera. You can still type dialogue below.';
    default:
      return 'The camera could not start. You can still type dialogue below.';
  }
}

async function startCameraLoop(
  view: View,
  config: AppConfig,
  ocr: OcrService,
  getPipeline: () => TranslationPipeline,
  getRoi: () => Roi,
): Promise<void> {
  await startCamera(view.video);
  const sampler = new FrameSampler(config.samplingIntervalMs);
  const stable = new StableTextGate(config.ocrStabilityFrames);
  const ctx = view.canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  let busy = false;
  let lastRoi = getRoi();

  const tick = () => {
    const now = performance.now();
    const w = view.video.videoWidth;
    const h = view.video.videoHeight;
    if (!busy && w > 0 && h > 0 && sampler.maybeSample(now)) {
      view.canvas.width = w;
      view.canvas.height = h;
      ctx.drawImage(view.video, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      const roi = getRoi();
      // A moved/resized region shows different text; start settling afresh.
      if (roi !== lastRoi) {
        lastRoi = roi;
        stable.reset();
      }
      const display = { width: view.video.clientWidth, height: view.video.clientHeight };
      const region = captureRegion(frame, displayToFrameRoi(roi, display, { width: w, height: h }), now);
      busy = true;
      void (async () => {
        try {
          const { text, confidence } = await getPipeline().recognize(region);
          const concrete = ocr as Partial<{ debugImage: HTMLCanvasElement | null }>;
          if (concrete.debugImage) view.setDebugImage(concrete.debugImage);
          view.setDebug(`OCR: "${text}" (conf ${confidence.toFixed(2)})`);
          if (confidence >= config.minOcrConfidence && text.length >= 2) {
            const accepted = stable.accept(text);
            if (accepted) await getPipeline().processText(accepted, now);
          } else {
            stable.reset();
          }
        } catch (err) {
          reportError(view, err);
        } finally {
          busy = false;
        }
      })();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export { stopCamera };

