import type { ImageLike } from '../../core/types';

/**
 * Prepare a captured region for OCR of on-screen text: upscale small regions,
 * convert to grayscale, stretch contrast between the 5th and 95th luminance
 * percentiles, and invert mostly-dark regions so text is dark on light. This
 * suppresses LCD moiré/color noise and greatly improves recognition of screen
 * fonts.
 */
export function preprocessForOcr(image: ImageLike, targetHeight = 384): HTMLCanvasElement {
  const scale = ocrScale(image.height, targetHeight);
  const w = Math.max(1, Math.round(image.width * scale));
  const h = Math.max(1, Math.round(image.height * scale));

  const src = document.createElement('canvas');
  src.width = image.width;
  src.height = image.height;
  const srcCtx = src.getContext('2d');
  const dst = document.createElement('canvas');
  dst.width = w;
  dst.height = h;
  const dstCtx = dst.getContext('2d');
  if (!srcCtx || !dstCtx) return dst;

  srcCtx.putImageData(
    new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
    0,
    0,
  );
  dstCtx.imageSmoothingEnabled = true;
  dstCtx.imageSmoothingQuality = 'high';
  dstCtx.drawImage(src, 0, 0, w, h);

  const scaled = dstCtx.getImageData(0, 0, w, h);
  enhanceForOcr(scaled.data);
  dstCtx.putImageData(scaled, 0, 0);
  return dst;
}

/** Upscale factor toward `targetHeight`, never shrinking and at most 4×. */
export function ocrScale(height: number, targetHeight = 384): number {
  return clamp(targetHeight / height, 1, 4);
}

/**
 * In place on RGBA pixels: grayscale, contrast-stretch between the 5th and
 * 95th luminance percentiles, and invert mostly-dark images (light text on a
 * dark box) so the result is always dark text on a light background.
 */
export function enhanceForOcr(rgba: Uint8ClampedArray): void {
  const gray = toGrayscale(rgba);
  if (gray.length === 0) return;

  const { lo, hi } = percentiles(gray, 0.05, 0.95);
  const range = Math.max(1, hi - lo);
  const mean = gray.reduce((a, b) => a + b, 0) / gray.length;
  const invert = mean < 128; // mostly-dark region => light text, so invert

  for (let i = 0; i < gray.length; i++) {
    let v = clamp(((gray[i] - lo) / range) * 255, 0, 255);
    if (invert) v = 255 - v;
    const p = i * 4;
    rgba[p] = rgba[p + 1] = rgba[p + 2] = v;
    rgba[p + 3] = 255;
  }
}

function toGrayscale(data: Uint8ClampedArray): Uint8Array {
  const out = new Uint8Array(data.length / 4);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    out[j] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
  }
  return out;
}

function percentiles(gray: Uint8Array, low: number, high: number): { lo: number; hi: number } {
  const hist = new Array<number>(256).fill(0);
  for (const g of gray) hist[g]++;
  const total = gray.length;
  const loCount = total * low;
  const hiCount = total * high;
  let cumulative = 0;
  let lo = 0;
  let hi = 255;
  let loSet = false;
  for (let t = 0; t < 256; t++) {
    cumulative += hist[t];
    if (!loSet && cumulative >= loCount) {
      lo = t;
      loSet = true;
    }
    if (cumulative >= hiCount) {
      hi = t;
      break;
    }
  }
  return { lo, hi };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
