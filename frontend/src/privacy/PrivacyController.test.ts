import { describe, it, expect, vi } from 'vitest';
import {
  PrivacyController,
  NetworkBlockedError,
  DisclosureRequiredError,
} from './PrivacyController';

describe('PrivacyController', () => {
  it('makes no network request in Local mode', async () => {
    const inner = vi.fn();
    const controller = new PrivacyController('local', inner as unknown as typeof fetch);
    await expect(controller.guardedFetch('/api/translate')).rejects.toBeInstanceOf(
      NetworkBlockedError,
    );
    expect(inner).not.toHaveBeenCalled();
  });

  it('shows the disclosure before the first Cloud request and blocks it', async () => {
    const inner = vi.fn();
    const controller = new PrivacyController('cloud', inner as unknown as typeof fetch);
    const disclosure = vi.fn();
    controller.onDisclosureNeeded(disclosure);

    await expect(controller.guardedFetch('/api/translate')).rejects.toBeInstanceOf(
      DisclosureRequiredError,
    );
    expect(disclosure).toHaveBeenCalledTimes(1);
    expect(inner).not.toHaveBeenCalled();
  });

  it('allows Cloud requests only after acknowledgement', async () => {
    const inner = vi.fn().mockResolvedValue(new Response('{}'));
    const controller = new PrivacyController('cloud', inner as unknown as typeof fetch);
    controller.acknowledgeCloud();
    await controller.guardedFetch('/api/translate');
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it('resets acknowledgement when returning to Local mode', () => {
    const controller = new PrivacyController('cloud');
    controller.acknowledgeCloud();
    expect(controller.isCloudAcknowledged()).toBe(true);
    controller.setMode('local');
    expect(controller.isCloudAcknowledged()).toBe(false);
  });
});
