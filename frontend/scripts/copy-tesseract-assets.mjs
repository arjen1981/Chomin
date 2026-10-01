// Copies the Tesseract.js worker, LSTM WASM cores, and Japanese language data
// from node_modules into public/tesseract so OCR is served same-origin (no CDN
// requests, cacheable for offline use). Runs before dev and build.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const modules = join(root, 'node_modules');
const out = join(root, 'public', 'tesseract');

const files = [
  ['tesseract.js/dist/worker.min.js', 'worker.min.js'],
  // The worker picks one of these at runtime based on WASM SIMD support.
  ['tesseract.js-core/tesseract-core-lstm.wasm.js', 'core/tesseract-core-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'core/tesseract-core-simd-lstm.wasm.js'],
  [
    'tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js',
    'core/tesseract-core-relaxedsimd-lstm.wasm.js',
  ],
  // LSTM-only engine uses the "best_int" model.
  ['@tesseract.js-data/jpn/4.0.0_best_int/jpn.traineddata.gz', 'lang/jpn.traineddata.gz'],
];

for (const [from, to] of files) {
  const target = join(out, to);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(modules, from), target);
}
console.log(`Copied ${files.length} Tesseract assets to public/tesseract`);
