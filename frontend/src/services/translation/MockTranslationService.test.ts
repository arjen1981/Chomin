import { describe, it, expect } from 'vitest';
import { MockTranslationService } from './MockTranslationService';
import { RollingContextBuffer } from '../../core/context';

const CJK = /[\u3040-\u30ff\u3400-\u9fff]/;

describe('MockTranslationService', () => {
  it('returns English-only dialogue with no Japanese or explanation', async () => {
    const svc = new MockTranslationService();
    const { english } = await svc.translate('お前、本当に行くのか？');
    expect(english.length).toBeGreaterThan(0);
    expect(CJK.test(english)).toBe(false);
    // no "translation:" style explanations
    expect(english.toLowerCase()).not.toContain('translat');
  });

  it('never leaks Japanese even in the fallback', async () => {
    const svc = new MockTranslationService();
    const { english } = await svc.translate('未知のセリフ');
    expect(CJK.test(english)).toBe(false);
  });

  it('succeeds with and without rolling context', async () => {
    const svc = new MockTranslationService();
    const withoutCtx = await svc.translate('ありがとう');
    expect(withoutCtx.english).toBe('Thank you.');

    const ctx = new RollingContextBuffer();
    ctx.add({ japanese: 'まて！', english: 'Wait!' });
    const withCtx = await svc.translate('ありがとう', ctx.snapshot());
    expect(withCtx.english).toBe('Thank you.');
  });
});
