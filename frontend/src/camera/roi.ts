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
  return Math.max(0, Math.min(1, v));
}
