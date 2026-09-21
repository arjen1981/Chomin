import type { ImageLike } from '../core/types';

/** Mean absolute per-channel difference between two equally sized images (0..255). */
export function meanAbsDiff(a: ImageLike, b: ImageLike): number {
  if (a.width !== b.width || a.height !== b.height) return Number.POSITIVE_INFINITY;
  const len = Math.min(a.data.length, b.data.length);
  if (len === 0) return 0;
  let sum = 0;
  // Sample every 4th pixel (stride 16 bytes) for speed; still stable for gating.
  for (let i = 0; i < len; i += 16) {
    sum += Math.abs(a.data[i] - b.data[i]);
    sum += Math.abs(a.data[i + 1] - b.data[i + 1]);
    sum += Math.abs(a.data[i + 2] - b.data[i + 2]);
  }
  const samples = Math.ceil(len / 16) * 3;
  return sum / samples;
}

/** Whether the region changed enough since the previous frame to warrant OCR. */
export function hasChanged(
  previous: ImageLike | null,
  current: ImageLike,
  threshold = 6,
): boolean {
  if (!previous) return true;
  return meanAbsDiff(previous, current) >= threshold;
}
