import { describe, it, expect } from 'vitest';
import { FrameSampler } from './frameSampler';

describe('FrameSampler', () => {
  it('never samples faster than the configured interval', () => {
    const sampler = new FrameSampler(350);
    let sampled = 0;
    // Simulate a 60fps preview (~16.7ms/frame) over 1 second.
    for (let t = 0; t <= 1000; t += 16) {
      if (sampler.maybeSample(t)) sampled++;
    }
    // At 350ms interval, at most ceil(1000/350)+1 = 4 samples.
    expect(sampled).toBeLessThanOrEqual(4);
    expect(sampled).toBeGreaterThan(0);
  });

  it('allows the first frame immediately', () => {
    const sampler = new FrameSampler(1000);
    expect(sampler.maybeSample(0)).toBe(true);
    expect(sampler.maybeSample(500)).toBe(false);
    expect(sampler.maybeSample(1000)).toBe(true);
  });
});
