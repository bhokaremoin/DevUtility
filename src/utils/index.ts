/**
 * @file utils/index.ts
 * @description Pure utility functions shared across the DevUtility app.
 *
 * Architecture Role: Stateless helpers with no React or RN dependencies.
 * Kept here so they can be reused by services, hooks, and components alike.
 */

/**
 * Generates a unique ID by combining the current timestamp with a random
 * base-36 suffix. Collision probability is negligible for local storage.
 *
 * @returns A string of the form `"<timestamp>-<random9chars>"`.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Truncates `text` to `maxLength` characters, appending an ellipsis if cut.
 *
 * @param text - The source string to truncate.
 * @param maxLength - Maximum allowed character count before truncation.
 * @returns The original string or a truncated version ending with `'…'`.
 */
export function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}

/**
 * Splits a comma-separated tag string into a trimmed, non-empty array.
 *
 * @param tagString - Raw input, e.g. `"nginx, docker , "`.
 * @returns Array of trimmed tag strings with empty entries removed.
 */
export function parseTags(tagString: string): string[] {
  return tagString.split(',').map(t => t.trim()).filter(Boolean);
}

/**
 * Formats a content string into a human-readable stat line.
 *
 * @param content - The text whose stats are computed.
 * @returns A string like `"1,234 chars / 42 lines"`.
 */
export function formatContentStats(content: string): string {
  return `${content.length.toLocaleString()} chars / ${content.split('\n').length.toLocaleString()} lines`;
}
