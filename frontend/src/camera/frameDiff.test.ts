import { describe, it, expect } from 'vitest';
import { hasChanged, meanAbsDiff } from './frameDiff';
import type { ImageLike } from '../core/types';

function solid(width: number, height: number, rgb: [number, number, number]): ImageLike {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgb[0];
    data[i + 1] = rgb[1];
    data[i + 2] = rgb[2];
    data[i + 3] = 255;
  }
  return { width, height, data };
}

describe('frameDiff', () => {
  it('reports no change for the first frame only when there is no previous', () => {
    expect(hasChanged(null, solid(4, 4, [0, 0, 0]))).toBe(true);
  });

  it('skips an unchanged ROI', () => {
    const a = solid(8, 8, [10, 20, 30]);
    const b = solid(8, 8, [10, 20, 30]);
    expect(hasChanged(a, b)).toBe(false);
  });

  it('detects a changed ROI', () => {
    const a = solid(8, 8, [0, 0, 0]);
    const b = solid(8, 8, [200, 200, 200]);
    expect(hasChanged(a, b)).toBe(true);
    expect(meanAbsDiff(a, b)).toBeGreaterThan(6);
  });
});
