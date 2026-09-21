import type { CapturedRegion, ImageLike } from '../core/types';
import { cropRegion, DEFAULT_ROI, type Roi } from './roi';

/** Raised when the camera cannot be started (permission denied or absent). */
export class CameraUnavailableError extends Error {
  constructor(
    message: string,
    readonly reason: 'denied' | 'notfound' | 'unsupported' | 'error',
  ) {
    super(message);
    this.name = 'CameraUnavailableError';
  }
}

/**
 * Start the rear-facing camera and attach it to a video element. Throws a
 * typed {@link CameraUnavailableError} the UI can present gracefully.
 */
export async function startCamera(
  video: HTMLVideoElement,
  mediaDevices: MediaDevices | undefined = navigator?.mediaDevices,
): Promise<MediaStream> {
  if (!mediaDevices?.getUserMedia) {
    throw new CameraUnavailableError('Camera API unavailable', 'unsupported');
  }
  try {
    const stream = await mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play().catch(() => undefined);
    return stream;
  } catch (err) {
    const name = (err as { name?: string }).name;
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      throw new CameraUnavailableError('Camera permission denied', 'denied');
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      throw new CameraUnavailableError('No camera found', 'notfound');
    }
    throw new CameraUnavailableError('Camera failed to start', 'error');
  }
}

export function stopCamera(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}

/**
 * Draw the current video frame's ROI to a canvas and return it as a captured
 * region containing only the selected area.
 */
export function captureRegion(
  source: ImageLike,
  roi: Roi = DEFAULT_ROI,
  now: number = Date.now(),
): CapturedRegion {
  return { image: cropRegion(source, roi), capturedAt: now };
}
