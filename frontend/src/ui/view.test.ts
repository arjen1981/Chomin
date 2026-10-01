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
    onRoiChange: vi.fn(),
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

describe('view ROI', () => {
  function sizedView() {
    const cb = callbacks();
    const view = createView(cb);
    const stage = view.root.querySelector('.stage') as HTMLElement;
    Object.defineProperty(stage, 'clientWidth', { value: 1000 });
    Object.defineProperty(stage, 'clientHeight', { value: 500 });
    const roi = view.root.querySelector('.roi') as HTMLElement;
    return { cb, roi, handle: roi.querySelector('.roi-handle') as HTMLElement };
  }

  // jsdom lacks PointerEvent; a MouseEvent carrying a pointerId is equivalent here.
  function pointer(type: string, x: number, y: number): Event {
    const e = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
    return Object.assign(e, { pointerId: 1 });
  }

  function drag(target: HTMLElement, from: [number, number], to: [number, number]) {
    target.dispatchEvent(pointer('pointerdown', ...from));
    target.dispatchEvent(pointer('pointermove', ...to));
    target.dispatchEvent(pointer('pointerup', ...to));
  }

  it('starts at the default region', () => {
    const { roi } = sizedView();
    expect(roi.style.left).toBe('8%');
    expect(roi.style.top).toBe('62%');
  });

  it('moves the region when the box is dragged', () => {
    const { cb, roi } = sizedView();
    drag(roi, [500, 400], [450, 350]); // 5% left, 10% up
    const next = cb.onRoiChange.mock.calls[0][0];
    expect(next.x).toBeCloseTo(0.03);
    expect(next.y).toBeCloseTo(0.52);
    expect(next.width).toBeCloseTo(0.84);
    expect(parseFloat(roi.style.left)).toBeCloseTo(3);
  });

  it('resizes the region when the corner handle is dragged', () => {
    const { cb, handle } = sizedView();
    drag(handle, [920, 460], [820, 435]); // 10% narrower, 5% shorter
    const next = cb.onRoiChange.mock.calls[0][0];
    expect(next.x).toBeCloseTo(0.08);
    expect(next.width).toBeCloseTo(0.74);
    expect(next.height).toBeCloseTo(0.25);
  });
});
