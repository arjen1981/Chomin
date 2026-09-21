import { describe, it, expect, vi } from 'vitest';
import { createView } from './view';

function callbacks() {
  return {
    onToggleSpeech: vi.fn(),
    onReplay: vi.fn(),
    onRate: vi.fn(),
    onVoice: vi.fn(),
    onModeChange: vi.fn(),
    onManualSubmit: vi.fn(),
    onAcknowledgeCloud: vi.fn(),
    onDeclineCloud: vi.fn(),
  };
}

describe('view', () => {
  it('renders the camera-forward layout elements', () => {
    const view = createView(callbacks());
    const r = view.root;
    expect(r.querySelector('video.preview')).not.toBeNull();
    expect(r.querySelector('.roi')).not.toBeNull();
    expect(r.querySelector('.japanese')).not.toBeNull();
    expect(r.querySelector('.english')).not.toBeNull();
    expect(r.querySelector('.indicator')).not.toBeNull();
    expect(r.querySelector('.controls')).not.toBeNull();
    expect(r.querySelector('select.mode')).not.toBeNull();
    expect(r.querySelector('.manual-input')).not.toBeNull();
  });

  it('updates displayed Japanese, English, and processing state', () => {
    const view = createView(callbacks());
    view.setJapanese('ありがとう');
    view.setEnglish('Thank you.');
    view.setProcessing('translating');
    expect(view.root.querySelector('.japanese')!.textContent).toBe('ありがとう');
    expect(view.root.querySelector('.english')!.textContent).toBe('Thank you.');
    expect(view.root.querySelector('.indicator')!.textContent).toBe('translating…');
  });

  it('invokes control callbacks', () => {
    const cb = callbacks();
    const view = createView(cb);
    (view.root.querySelectorAll('button.ctrl')[0] as HTMLButtonElement).click(); // speech
    expect(cb.onToggleSpeech).toHaveBeenCalled();

    const mode = view.root.querySelector('select.mode') as HTMLSelectElement;
    mode.value = 'cloud';
    mode.dispatchEvent(new Event('change'));
    expect(cb.onModeChange).toHaveBeenCalledWith('cloud');
  });

  it('shows and hides the cloud disclosure', () => {
    const view = createView(callbacks());
    const disclosure = view.root.querySelector('.disclosure')!;
    expect(disclosure.classList.contains('hidden')).toBe(true);
    view.showDisclosure();
    expect(disclosure.classList.contains('hidden')).toBe(false);
    view.hideDisclosure();
    expect(disclosure.classList.contains('hidden')).toBe(true);
  });
});
