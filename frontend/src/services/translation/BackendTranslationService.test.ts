import { describe, it, expect, vi } from 'vitest';
import { BackendTranslationService } from './BackendTranslationService';

describe('BackendTranslationService', () => {
  it('sends only text — never image or frame data', async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      // Only text-derived fields are permitted.
      expect(Object.keys(body).sort()).toEqual(['japanese', 'recentLines', 'terms']);
      expect(JSON.stringify(body)).not.toMatch(/image|frame|pixels|data:image/i);
      return new Response(JSON.stringify({ english: 'Wait!' }), { status: 200 });
    });

    const svc = new BackendTranslationService(
      '/api/translate',
      fetchImpl as unknown as typeof fetch,
    );
    const result = await svc.translate('まて！');
    expect(result.english).toBe('Wait!');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('surfaces backend errors', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 500 }));
    const svc = new BackendTranslationService(
      '/api/translate',
      fetchImpl as unknown as typeof fetch,
    );
    await expect(svc.translate('x')).rejects.toThrow();
  });
});
