// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CORE_DIR = fileURLToPath(new URL('../src/core/', import.meta.url));

function coreFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return coreFiles(full);
    if (name.endsWith('.ts') && !name.endsWith('.test.ts')) return [full];
    return [];
  });
}

describe('core is framework-agnostic', () => {
  it('does not reference the DOM or UI layers', () => {
    const offenders: string[] = [];
    for (const file of coreFiles(CORE_DIR)) {
      const src = readFileSync(file, 'utf8');
      if (/\b(document|window)\b/.test(src)) offenders.push(`${file}: DOM global`);
      if (/from ['"][^'"]*\/(ui|services|camera)\b/.test(src)) {
        offenders.push(`${file}: imports UI/services/camera`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
