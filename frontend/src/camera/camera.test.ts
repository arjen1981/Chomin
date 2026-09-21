import { describe, it, expect, vi } from 'vitest';
import { startCamera, stopCamera, captureRegion, CameraUnavailableError } from './camera';
import { cropRegion } from './roi';
import type { ImageLike } from '../core/types';

function makeVideo(): HTMLVideoElement {
  const el = { srcObject: null, play: vi.fn().mockResolvedValue(undefined) };
  return el as unknown as HTMLVideoElement;
}

function fakeStream(): MediaStream {
  const track = { stop: vi.fn() };
  return { getTracks: () => [track] } as unknown as MediaStream;
}

describe('startCamera', () => {
  it('attaches the stream on the grant path', async () => {
    const stream = fakeStream();
    const md = { getUserMedia: vi.fn().mockResolvedValue(stream) } as unknown as MediaDevices;
    const video = makeVideo();
    const result = await startCamera(video, md);
    expect(result).toBe(stream);
    expect(video.srcObject).toBe(stream);
  });

  it('throws a typed error on the deny path', async () => {
    const md = {
      getUserMedia: vi.fn().mockRejectedValue(Object.assign(new Error('no'), { name: 'NotAllowedError' })),
    } as unknown as MediaDevices;
    await expect(startCamera(makeVideo(), md)).rejects.toMatchObject({
      name: 'CameraUnavailableError',
      reason: 'denied',
    });
  });

  it('throws when the camera API is unsupported', async () => {
    await expect(startCamera(makeVideo(), undefined)).rejects.toBeInstanceOf(
      CameraUnavailableError,
    );
  });
});

describe('stopCamera', () => {
  it('stops all tracks', () => {
    const stream = fakeStream();
    const track = stream.getTracks()[0];
    stopCamera(stream);
    expect(track.stop).toHaveBeenCalled();
  });
});

describe('captureRegion', () => {
  it('captures only the selected ROI (right half stays blue)', () => {
    const width = 8;
    const height = 8;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const blue = x >= width / 2;
        data[i] = blue ? 0 : 255; // red for left, 0 for right
        data[i + 2] = blue ? 255 : 0; // blue for right
        data[i + 3] = 255;
      }
    }
    const source: ImageLike = { width, height, data };
    const region = captureRegion(source, { x: 0.5, y: 0, width: 0.5, height: 1 });
    // Every pixel in the cropped right half must be blue, none red.
    for (let i = 0; i < region.image.data.length; i += 4) {
      expect(region.image.data[i]).toBe(0); // no red
      expect(region.image.data[i + 2]).toBe(255); // blue
    }
    expect(region.image.width).toBe(4);
  });

  it('cropRegion produces the ROI dimensions', () => {
    const source: ImageLike = {
      width: 100,
      height: 100,
      data: new Uint8ClampedArray(100 * 100 * 4),
    };
    const cropped = cropRegion(source, { x: 0.1, y: 0.2, width: 0.5, height: 0.4 });
    expect(cropped.width).toBe(50);
    expect(cropped.height).toBe(40);
  });
});
