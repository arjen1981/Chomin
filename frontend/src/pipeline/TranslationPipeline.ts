import type { CapturedRegion, DialogueLine, ProcessingState } from '../core/types';
import { Deduplicator } from '../core/dedup';
import { RollingContextBuffer } from '../core/context';
import type { AppServices } from '../services/factory';

export type PipelineStatus = 'empty' | 'duplicate' | 'translated';

export interface PipelineOutcome {
  readonly status: PipelineStatus;
  readonly japanese?: string;
  readonly english?: string;
}

export interface PipelineOptions {
  dedup?: Deduplicator;
  context?: RollingContextBuffer;
}

type Listener<T> = (value: T) => void;

/**
 * Connects capture → OCR → dedup → translation → speech using only the
 * service contracts. Exposes processing state and emits translated dialogue.
 */
export class TranslationPipeline {
  private state: ProcessingState = 'idle';
  private readonly dedup: Deduplicator;
  private readonly context: RollingContextBuffer;
  private readonly stateListeners = new Set<Listener<ProcessingState>>();
  private readonly dialogueListeners = new Set<Listener<DialogueLine>>();

  constructor(
    private readonly services: AppServices,
    options: PipelineOptions = {},
  ) {
    this.dedup = options.dedup ?? new Deduplicator();
    this.context = options.context ?? new RollingContextBuffer();
  }

  getState(): ProcessingState {
    return this.state;
  }

  onState(listener: Listener<ProcessingState>): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onDialogue(listener: Listener<DialogueLine>): () => void {
    this.dialogueListeners.add(listener);
    return () => this.dialogueListeners.delete(listener);
  }

  /** Run one captured region through the full pipeline. */
  async processRegion(
    region: CapturedRegion,
    now: number = Date.now(),
  ): Promise<PipelineOutcome> {
    this.setState('recognizing');
    const { text: japanese } = await this.services.ocr.recognize(region);

    if (japanese.trim() === '') {
      this.setState('idle');
      return { status: 'empty' };
    }

    if (!this.dedup.shouldProcess(japanese, now)) {
      this.setState('idle');
      return { status: 'duplicate', japanese };
    }

    this.setState('translating');
    const { english } = await this.services.translation.translate(
      japanese,
      this.context.snapshot(),
    );

    const line: DialogueLine = { japanese, english };
    this.context.add(line);
    this.emitDialogue(line);

    this.setState('speaking');
    this.services.speech.speak(english);
    this.setState('idle');

    return { status: 'translated', japanese, english };
  }

  private setState(state: ProcessingState): void {
    this.state = state;
    for (const listener of this.stateListeners) listener(state);
  }

  private emitDialogue(line: DialogueLine): void {
    for (const listener of this.dialogueListeners) listener(line);
  }
}
