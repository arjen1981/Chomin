import type { PrivacyMode } from '../core/types';

export class NetworkBlockedError extends Error {
  constructor() {
    super('Network egress is blocked in Local mode');
    this.name = 'NetworkBlockedError';
  }
}

export class DisclosureRequiredError extends Error {
  constructor() {
    super('Cloud mode disclosure must be acknowledged before sending data');
    this.name = 'DisclosureRequiredError';
  }
}

/**
 * Gates all network egress by privacy mode. In Local mode no request is ever
 * made. In Cloud mode the user must acknowledge a disclosure before the first
 * remote request; until then the guarded fetch fires a disclosure callback and
 * blocks, never calling the underlying fetch.
 */
export class PrivacyController {
  private mode: PrivacyMode;
  private cloudAcknowledged = false;
  private disclosureListeners = new Set<() => void>();

  constructor(
    initialMode: PrivacyMode = 'local',
    private readonly innerFetch: typeof fetch = fetch,
  ) {
    this.mode = initialMode;
  }

  getMode(): PrivacyMode {
    return this.mode;
  }

  setMode(mode: PrivacyMode): void {
    this.mode = mode;
    if (mode === 'local') this.cloudAcknowledged = false;
  }

  onDisclosureNeeded(listener: () => void): () => void {
    this.disclosureListeners.add(listener);
    return () => this.disclosureListeners.delete(listener);
  }

  acknowledgeCloud(): void {
    this.cloudAcknowledged = true;
  }

  isCloudAcknowledged(): boolean {
    return this.cloudAcknowledged;
  }

  /** A fetch that enforces the privacy policy. Bind it into cloud services. */
  guardedFetch: typeof fetch = (input, init?) => {
    if (this.mode === 'local') {
      return Promise.reject(new NetworkBlockedError());
    }
    if (!this.cloudAcknowledged) {
      for (const listener of this.disclosureListeners) listener();
      return Promise.reject(new DisclosureRequiredError());
    }
    return this.innerFetch(input, init);
  };
}
