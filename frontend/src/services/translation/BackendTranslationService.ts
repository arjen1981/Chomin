import type { RollingContext, TranslationResult } from '../../core/types';
import type { TranslationService } from './TranslationService';

/**
 * Cloud-mode translation that delegates to the optional ASP.NET Core backend.
 * Only text is ever sent — never camera frames. Used exclusively when the user
 * has explicitly enabled Cloud mode.
 */
export class BackendTranslationService implements TranslationService {
  constructor(
    private readonly endpoint: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async translate(
    japanese: string,
    context?: RollingContext,
  ): Promise<TranslationResult> {
    const response = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        japanese,
        recentLines: context?.recentLines ?? [],
        terms: context?.terms ?? {},
      }),
    });
    if (!response.ok) {
      throw new Error(`Translation backend returned ${response.status}`);
    }
    const data = (await response.json()) as { english?: string };
    return { english: data.english ?? '' };
  }
}
