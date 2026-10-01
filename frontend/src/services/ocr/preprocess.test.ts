import { describe, it, expect } from 'vitest';
import { enhanceForOcr, ocrScale } from './preprocess';

/** RGBA buffer from a list of [r, g, b] pixels. */
function pixels(list: Array<[number, number, number]>): Uint8ClampedArray {
  const out = new Uint8ClampedArray(list.length * 4);
  list.forEach(([r, g, b], i) => out.set([r, g, b, 255], i * 4));
  return out;
}

function grayAt(rgba: Uint8ClampedArray, i: number): number {
  return rgba[i * 4];
}

describe('ocrScale', () => {
  it('upscales small regions toward the target height', () => {
    expect(ocrScale(192, 384)).toBe(2);
  });

  it('caps the upscale at 4x', () => {
    expect(ocrScale(20, 384)).toBe(4);
  });

  it('never shrinks large regions', () => {
    expect(ocrScale(1000, 384)).toBe(1);
  });
});

describe('enhanceForOcr', () => {
  it('produces grayscale, opaque pixels', () => {
    const rgba = pixels([
      [200, 30, 30],
      [240, 240, 240],
      [10, 10, 10],
      [250, 250, 250],
    ]);
    enhanceForOcr(rgba);
    for (let i = 0; i < 4; i++) {
      expect(rgba[i * 4]).toBe(rgba[i * 4 + 1]);
      expect(rgba[i * 4]).toBe(rgba[i * 4 + 2]);
      expect(rgba[i * 4 + 3]).toBe(255);
    }
  });

  it('keeps dark text on a light background as dark-on-light, with full contrast', () => {
    // Mostly light background with one dark "text" pixel.
    const rgba = pixels([
      [180, 180, 180],
      [180, 180, 180],
      [180, 180, 180],
      [60, 60, 60],
    ]);
    enhanceForOcr(rgba);
    expect(grayAt(rgba, 0)).toBe(255);
    expect(grayAt(rgba, 3)).toBe(0);
  });

  it('inverts light text on a dark dialogue box to dark-on-light', () => {
    // Mostly dark box with one light "text" pixel.
    const rgba = pixels([
      [20, 20, 40],
      [20, 20, 40],
      [20, 20, 40],
      [230, 230, 230],
    ]);
    enhanceForOcr(rgba);
    expect(grayAt(rgba, 0)).toBe(255); // background becomes light
    expect(grayAt(rgba, 3)).toBe(0); // text becomes dark
  });

  it('handles an empty buffer', () => {
    const rgba = new Uint8ClampedArray(0);
    expect(() => enhanceForOcr(rgba)).not.toThrow();
  });
});
