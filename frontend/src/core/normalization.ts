/**
 * Text normalization used before deduplication and translation so that
 * equivalent readings of the same on-screen line compare equal.
 */

// Punctuation (incl. full-width Japanese) collapsed for comparison purposes.
const PUNCTUATION =
  /[\s\u3000。、．，！？!?｡､…‥・「」『』（）()【】\[\]—―ー~〜]+/gu;

/**
 * Collapse redundant whitespace and trim. Preserves inner characters so the
 * result remains human-readable and usable for translation.
 */
export function normalizeWhitespace(input: string): string {
  return input.replace(/[\s\u3000]+/gu, ' ').trim();
}

/**
 * A comparison key: lowercased, punctuation and whitespace removed. Used only
 * for equality/fuzzy matching, never shown to the user or sent to translation.
 */
export function comparisonKey(input: string): string {
  return input.normalize('NFKC').replace(PUNCTUATION, '').toLowerCase();
}
