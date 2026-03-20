/**
 * @file data/shortcuts.ts
 * @description Static data describing all keyboard shortcuts shown in the
 * Shortcuts help modal.
 *
 * Architecture Role: Pure data layer consumed by `ShortcutsModal`. Keeping the
 * shortcut definitions here (rather than inline in the component) makes it
 * easy to add new shortcuts without touching UI code.
 */

/** A single row in the shortcuts reference table. */
export interface ShortcutRow {
  /** Human-readable description of the action triggered by this shortcut. */
  action: string;
  /** Ordered list of key labels, e.g. `['⌘', '1']` or `['↑ / ↓']`. */
  keys: string[];
}

/** A named group of related shortcuts rendered as a section in the modal. */
export interface ShortcutSection {
  /** Section heading, e.g. `'Navigation'`. */
  title: string;
  /** Rows belonging to this section. */
  rows: ShortcutRow[];
}

/**
 * All keyboard shortcut sections displayed in the help modal, ordered from
 * most general (System) to most specific (Actions).
 */
export const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'System',
    rows: [
      {action: 'Toggle panel (show / hide)', keys: ['Ctrl', 'Option', 'D']},
    ],
  },
  {
    title: 'Navigation',
    rows: [
      {action: 'Switch to Clipboard tab', keys: ['⌘', '1']},
      {action: 'Switch to Snippets tab', keys: ['⌘', '2']},
      {action: 'Switch to Settings tab', keys: ['⌘', '3']},
    ],
  },
  {
    title: 'Actions',
    rows: [
      {action: 'Focus search / jump to Snippets', keys: ['⌘', 'F']},
      {action: 'Copy selected item (list focused)', keys: ['↵']},
      {action: 'Copy selected item (detail editor)', keys: ['⌘', '↵']},
      {action: 'Clear selection; hide panel if empty', keys: ['Esc']},
      {action: 'Navigate list up / down', keys: ['↑ / ↓']},
    ],
  },
];
