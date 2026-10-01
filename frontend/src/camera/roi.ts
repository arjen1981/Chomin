import type { ImageLike } from '../core/types';

/** A region of interest expressed as fractions (0..1) of the source frame. */
export interface Roi {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Sensible default: a wide band across the lower third where dialogue sits. */
export const DEFAULT_ROI: Roi = { x: 0.08, y: 0.62, width: 0.84, height: 0.3 };

export function clampRoi(roi: Roi): Roi {
  const x = clamp01(roi.x);
  const y = clamp01(roi.y);
  return {
    x,
    y,
    width: Math.max(0.01, Math.min(1 - x, roi.width)),
    height: Math.max(0.01, Math.min(1 - y, roi.height)),
  };
}

/** Smallest ROI side (fraction of the display) the user can resize to. */
export const MIN_ROI_SIZE = 0.05;

/** Move the ROI by a fractional offset, keeping it fully inside the frame. */
export function moveRoi(roi: Roi, dx: number, dy: number): Roi {
  return {
    ...roi,
    x: clamp(roi.x + dx, 0, 1 - roi.width),
    y: clamp(roi.y + dy, 0, 1 - roi.height),
  };
}

/** Resize the ROI from its bottom-right corner, within the frame and a minimum size. */
export function resizeRoi(roi: Roi, dw: number, dh: number): Roi {
  return {
    ...roi,
    width: clamp(roi.width + dw, MIN_ROI_SIZE, 1 - roi.x),
    height: clamp(roi.height + dh, MIN_ROI_SIZE, 1 - roi.y),
  };
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * Convert an ROI drawn over the preview (fractions of the display box) into
 * fractions of the camera frame. The preview uses `object-fit: cover`, so the
 * frame is scaled to fill the box and its overflow is cropped equally on both
 * sides; this undoes that so OCR sees exactly what the overlay shows.
 */
export function displayToFrameRoi(roi: Roi, display: Size, frame: Size): Roi {
  if (display.width <= 0 || display.height <= 0 || frame.width <= 0 || frame.height <= 0) {
    return clampRoi(roi);
  }
  const scale = Math.max(display.width / frame.width, display.height / frame.height);
  const offsetX = (frame.width * scale - display.width) / 2;
  const offsetY = (frame.height * scale - display.height) / 2;
  return clampRoi({
    x: (roi.x * display.width + offsetX) / scale / frame.width,
    y: (roi.y * display.height + offsetY) / scale / frame.height,
    width: (roi.width * display.width) / scale / frame.width,
    height: (roi.height * display.height) / scale / frame.height,
  });
}

/** Extract only the ROI sub-rectangle from a source image. */
export function cropRegion(source: ImageLike, roi: Roi): ImageLike {
  const r = clampRoi(roi);
  const sx = Math.floor(r.x * source.width);
  const sy = Math.floor(r.y * source.height);
  const w = Math.max(1, Math.floor(r.width * source.width));
  const h = Math.max(1, Math.floor(r.height * source.height));
  const out = new Uint8ClampedArray(w * h * 4);
  for (let row = 0; row < h; row++) {
    const srcStart = ((sy + row) * source.width + sx) * 4;
    const dstStart = row * w * 4;
    out.set(source.data.subarray(srcStart, srcStart + w * 4), dstStart);
  }
  return { width: w, height: h, data: out };
}

function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
