import { describe, it, expect } from 'vitest';
import { displayToFrameRoi, MIN_ROI_SIZE, moveRoi, resizeRoi, type Roi } from './roi';

const roi: Roi = { x: 0.1, y: 0.6, width: 0.8, height: 0.3 };

function expectRoiClose(actual: Roi, expected: Roi): void {
  expect(actual.x).toBeCloseTo(expected.x);
  expect(actual.y).toBeCloseTo(expected.y);
  expect(actual.width).toBeCloseTo(expected.width);
  expect(actual.height).toBeCloseTo(expected.height);
}

describe('moveRoi', () => {
  it('moves by the given offset', () => {
    expectRoiClose(moveRoi(roi, 0.05, -0.1), { x: 0.15, y: 0.5, width: 0.8, height: 0.3 });
  });

  it('keeps the ROI inside the frame without shrinking it', () => {
    expectRoiClose(moveRoi(roi, 0.5, 0.5), { x: 0.2, y: 0.7, width: 0.8, height: 0.3 });
    expectRoiClose(moveRoi(roi, -1, -1), { x: 0, y: 0, width: 0.8, height: 0.3 });
  });
});

describe('resizeRoi', () => {
  it('resizes from the bottom-right corner', () => {
    expectRoiClose(resizeRoi(roi, -0.2, 0.05), { x: 0.1, y: 0.6, width: 0.6, height: 0.35 });
  });

  it('stays within the frame and above the minimum size', () => {
    const grown = resizeRoi(roi, 1, 1);
    expect(grown.width).toBeCloseTo(0.9);
    expect(grown.height).toBeCloseTo(0.4);
    const shrunk = resizeRoi(roi, -1, -1);
    expect(shrunk.width).toBe(MIN_ROI_SIZE);
    expect(shrunk.height).toBe(MIN_ROI_SIZE);
  });
});

describe('displayToFrameRoi', () => {
  it('is the identity when display and frame have the same aspect ratio', () => {
    expectRoiClose(
      displayToFrameRoi(roi, { width: 640, height: 360 }, { width: 1280, height: 720 }),
      roi,
    );
  });

  it('undoes object-fit: cover cropping of a wide frame in a tall display', () => {
    // 1600x900 frame shown in a 900x900 box: scaled to 1600x900, 350px cropped each side.
    const full: Roi = { x: 0, y: 0, width: 1, height: 1 };
    expectRoiClose(
      displayToFrameRoi(full, { width: 900, height: 900 }, { width: 1600, height: 900 }),
      { x: 350 / 1600, y: 0, width: 900 / 1600, height: 1 },
    );
  });

  it('undoes cropping of a tall frame in a wide display', () => {
    // 900x1600 frame in a 900x900 box: 350px cropped top and bottom.
    const band: Roi = { x: 0, y: 0.5, width: 1, height: 0.5 };
    expectRoiClose(
      displayToFrameRoi(band, { width: 900, height: 900 }, { width: 900, height: 1600 }),
      { x: 0, y: 800 / 1600, width: 1, height: 450 / 1600 },
    );
  });

  it('falls back to the display ROI when sizes are unknown', () => {
    expectRoiClose(displayToFrameRoi(roi, { width: 0, height: 0 }, { width: 1280, height: 720 }), roi);
  });
});
