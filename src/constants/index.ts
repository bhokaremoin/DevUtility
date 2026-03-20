/**
 * @file constants/index.ts
 * @description App-wide constants for DevUtility.
 *
 * Architecture Role: Single place to tune behavioural limits, timing values,
 * and AsyncStorage keys so changes propagate automatically to every consumer.
 */

/** Maximum number of clipboard entries retained in history. Oldest items are
 *  evicted once this limit is reached. */
export const MAX_HISTORY_ITEMS = 15;

/** How often (ms) the clipboard is polled for new content by `useClipboardPoller`. */
export const CLIPBOARD_POLL_INTERVAL_MS = 2000;

/** How long (ms) the "Copied!" feedback badge stays visible after a copy action. */
export const COPY_FEEDBACK_DURATION_MS = 1500;

/** AsyncStorage key for persisted snippet data. */
export const SNIPPETS_STORAGE_KEY = '@devutility/snippets';

/** AsyncStorage key for persisted clipboard history. */
export const CLIPBOARD_STORAGE_KEY = '@devutility/clipboard_history';

/** Maximum characters shown in a clipboard master-list row before truncation. */
export const MAX_DISPLAY_LENGTH = 120;

/** Human-readable label for the default toggle shortcut (Ctrl+Option+D). */
export const DEFAULT_SHORTCUT_LABEL = '\u2303\u2325D';
