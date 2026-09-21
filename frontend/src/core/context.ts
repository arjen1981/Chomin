import type { DialogueLine, RollingContext } from './types';

/**
 * A small, bounded buffer of recent dialogue and known terminology used as
 * optional translation context. Never persisted; the pipeline works without it.
 */
export class RollingContextBuffer {
  private readonly lines: DialogueLine[] = [];
  private readonly terms: Record<string, string> = {};

  constructor(private readonly maxLines: number = 5) {}

  add(line: DialogueLine): void {
    this.lines.push(line);
    while (this.lines.length > this.maxLines) this.lines.shift();
  }

  addTerm(japanese: string, english: string): void {
    this.terms[japanese] = english;
  }

  snapshot(): RollingContext {
    return {
      recentLines: [...this.lines],
      terms: { ...this.terms },
    };
  }
}
