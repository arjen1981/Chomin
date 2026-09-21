import type { PrivacyMode, ProcessingState } from '../core/types';
import type { SpeechVoice } from '../services/speech/SpeechService';

export interface ViewCallbacks {
  onToggleSpeech(): void;
  onReplay(): void;
  onRate(rate: number): void;
  onVoice(voiceId: string): void;
  onModeChange(mode: PrivacyMode): void;
  onManualSubmit(text: string): void;
  onAcknowledgeCloud(): void;
  onDeclineCloud(): void;
}

export interface View {
  readonly root: HTMLElement;
  readonly video: HTMLVideoElement;
  readonly canvas: HTMLCanvasElement;
  setJapanese(text: string): void;
  setEnglish(text: string): void;
  setProcessing(state: ProcessingState): void;
  setSpeechEnabled(enabled: boolean): void;
  setVoices(voices: SpeechVoice[]): void;
  setMode(mode: PrivacyMode): void;
  showDisclosure(): void;
  hideDisclosure(): void;
  showCameraError(message: string): void;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/** Build the camera-forward UI and wire control events to callbacks. */
export function createView(cb: ViewCallbacks): View {
  const root = el('div', 'app');

  const video = el('video');
  video.className = 'preview';
  video.setAttribute('playsinline', '');
  video.muted = true;
  const canvas = el('canvas', 'capture-canvas');

  const roi = el('div', 'roi');

  const cameraError = el('div', 'camera-error hidden');

  const stage = el('div', 'stage');
  stage.append(video, roi, cameraError);

  // Text overlays
  const japanese = el('p', 'japanese');
  const english = el('p', 'english');
  const indicator = el('div', 'indicator');
  const textPanel = el('div', 'text-panel');
  textPanel.append(indicator, japanese, english);

  // Controls
  const speechBtn = el('button', 'ctrl');
  speechBtn.type = 'button';
  speechBtn.textContent = '🔊 Speech: on';
  speechBtn.addEventListener('click', () => cb.onToggleSpeech());

  const replayBtn = el('button', 'ctrl');
  replayBtn.type = 'button';
  replayBtn.textContent = '↻ Replay';
  replayBtn.addEventListener('click', () => cb.onReplay());

  const rate = el('input', 'rate');
  rate.type = 'range';
  rate.min = '0.5';
  rate.max = '2';
  rate.step = '0.1';
  rate.value = '1';
  rate.addEventListener('input', () => cb.onRate(Number(rate.value)));

  const voiceSelect = el('select', 'voice');
  voiceSelect.addEventListener('change', () => cb.onVoice(voiceSelect.value));

  const modeSelect = el('select', 'mode');
  for (const m of ['local', 'cloud'] as PrivacyMode[]) {
    const opt = el('option');
    opt.value = m;
    opt.textContent = m === 'local' ? 'Local (private)' : 'Cloud';
    modeSelect.append(opt);
  }
  modeSelect.addEventListener('change', () =>
    cb.onModeChange(modeSelect.value as PrivacyMode),
  );

  const controls = el('div', 'controls');
  controls.append(speechBtn, replayBtn, rate, voiceSelect, modeSelect);

  // Manual capture (MVP fallback so the demo works without a live camera)
  const manualInput = el('input', 'manual-input');
  manualInput.type = 'text';
  manualInput.placeholder = 'Or type Japanese dialogue…';
  const manualBtn = el('button', 'ctrl');
  manualBtn.type = 'button';
  manualBtn.textContent = 'Translate';
  const submitManual = () => {
    if (manualInput.value.trim()) {
      cb.onManualSubmit(manualInput.value);
      manualInput.value = '';
    }
  };
  manualBtn.addEventListener('click', submitManual);
  manualInput.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') submitManual();
  });
  const manual = el('div', 'manual');
  manual.append(manualInput, manualBtn);

  // Cloud disclosure dialog
  const disclosure = el('div', 'disclosure hidden');
  const disclosureBox = el('div', 'disclosure-box');
  const disclosureText = el('p');
  disclosureText.textContent =
    'Cloud mode sends recognized text (never camera frames) to a remote server for translation. Enable Cloud mode?';
  const enableCloud = el('button', 'ctrl');
  enableCloud.type = 'button';
  enableCloud.textContent = 'Enable Cloud';
  enableCloud.addEventListener('click', () => cb.onAcknowledgeCloud());
  const cancelCloud = el('button', 'ctrl');
  cancelCloud.type = 'button';
  cancelCloud.textContent = 'Stay Local';
  cancelCloud.addEventListener('click', () => cb.onDeclineCloud());
  disclosureBox.append(disclosureText, enableCloud, cancelCloud);
  disclosure.append(disclosureBox);

  const panel = el('div', 'panel');
  panel.append(textPanel, controls, manual);

  root.append(stage, panel, disclosure);

  return {
    root,
    video,
    canvas,
    setJapanese: (t) => (japanese.textContent = t),
    setEnglish: (t) => (english.textContent = t),
    setProcessing: (state: ProcessingState) => {
      indicator.dataset.state = state;
      indicator.textContent = state === 'idle' ? '' : `${state}…`;
    },
    setSpeechEnabled: (enabled) => {
      speechBtn.textContent = enabled ? '🔊 Speech: on' : '🔇 Speech: off';
    },
    setVoices: (voices) => {
      voiceSelect.replaceChildren();
      for (const v of voices) {
        const opt = el('option');
        opt.value = v.id;
        opt.textContent = v.name;
        voiceSelect.append(opt);
      }
    },
    setMode: (mode) => (modeSelect.value = mode),
    showDisclosure: () => disclosure.classList.remove('hidden'),
    hideDisclosure: () => disclosure.classList.add('hidden'),
    showCameraError: (message) => {
      cameraError.textContent = message;
      cameraError.classList.remove('hidden');
    },
  };
}
