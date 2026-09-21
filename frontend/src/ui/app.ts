import type { AppConfig } from '../config';
import { DEFAULT_CONFIG } from '../config';
import type { AppServices } from '../services/factory';
import { createServices } from '../services/factory';
import { MockOcrService } from '../services/ocr/MockOcrService';
import { WebSpeechService } from '../services/speech/WebSpeechService';
import { PrivacyController } from '../privacy/PrivacyController';
import { TranslationPipeline } from '../pipeline/TranslationPipeline';
import { startCamera, stopCamera, captureRegion, CameraUnavailableError } from '../camera/camera';
import { FrameSampler } from '../camera/frameSampler';
import { hasChanged } from '../camera/frameDiff';
import { DEFAULT_ROI } from '../camera/roi';
import type { CapturedRegion, ImageLike, PrivacyMode } from '../core/types';
import { createView, type View } from './view';

export interface MountOverrides {
  config?: AppConfig;
  controller?: PrivacyController;
  ocr?: MockOcrService;
  services?: AppServices;
}

/** Bootstrap the application: build services, view, and start the camera loop. */
export function mountApp(root: HTMLElement, overrides: MountOverrides = {}): void {
  const config: AppConfig = { ...DEFAULT_CONFIG, ...overrides.config };
  const controller =
    overrides.controller ?? new PrivacyController(config.mode, globalThis.fetch);
  const ocr = overrides.ocr ?? new MockOcrService();

  let services: AppServices =
    overrides.services ??
    createServices(config, { ocr, fetch: controller.guardedFetch });
  let pipeline = new TranslationPipeline(services);

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
  });
  root.replaceChildren(view.root);

  wirePipeline();
  view.setMode(config.mode);
  view.setSpeechEnabled(services.speech.isEnabled());
  refreshVoices();

  controller.onDisclosureNeeded(() => view.showDisclosure());

  // iOS requires a user gesture to unlock audio; do it once on first tap.
  const unlockOnce = () => {
    if (services.speech instanceof WebSpeechService) services.speech.unlock();
    root.removeEventListener('pointerdown', unlockOnce);
  };
  root.addEventListener('pointerdown', unlockOnce);

  function wirePipeline(): void {
    pipeline.onState((s) => view.setProcessing(s));
    pipeline.onDialogue((line) => {
      view.setJapanese(line.japanese);
      view.setEnglish(line.english);
    });
  }

  function rebuildServices(): void {
    services = createServices(config, { ocr, fetch: controller.guardedFetch });
    pipeline = new TranslationPipeline(services);
    wirePipeline();
    view.setSpeechEnabled(services.speech.isEnabled());
    refreshVoices();
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
    ocr.setText(text);
    void pipeline.processRegion(dummyRegion());
  }

  startCameraLoop(view, config, ocr, () => pipeline).catch((err) => {
    if (err instanceof CameraUnavailableError) {
      view.showCameraError(cameraMessage(err));
    }
  });
}

function dummyRegion(): CapturedRegion {
  return { image: { width: 1, height: 1, data: new Uint8ClampedArray(4) }, capturedAt: Date.now() };
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
  ocr: MockOcrService,
  getPipeline: () => TranslationPipeline,
): Promise<void> {
  await startCamera(view.video);
  const sampler = new FrameSampler(config.samplingIntervalMs);
  const ctx = view.canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  let previous: ImageLike | null = null;

  const tick = () => {
    const now = performance.now();
    const w = view.video.videoWidth;
    const h = view.video.videoHeight;
    if (w > 0 && h > 0 && sampler.maybeSample(now)) {
      view.canvas.width = w;
      view.canvas.height = h;
      ctx.drawImage(view.video, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      const region = captureRegion(frame, DEFAULT_ROI, now);
      if (hasChanged(previous, region.image)) {
        previous = region.image;
        // Live OCR is deferred; the region gates work, manual input supplies text.
        void ocr.recognize(region).then((r) => {
          if (r.text.trim() !== '') void getPipeline().processRegion(region, now);
        });
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export { stopCamera };

