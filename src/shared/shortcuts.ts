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
      {action: 'Open / close Clipboard', keys: ['Ctrl', 'Option', 'V']},
      {action: 'Open / close Snippets', keys: ['Ctrl', 'Option', 'S']},
    ],
  },
  {
    title: 'Navigation',
    rows: [
      {action: 'Open Settings', keys: ['⌘', ',']},
    ],
  },
  {
    title: 'Actions',
    rows: [
      {action: 'Focus search (Snippets)', keys: ['⌘', 'F']},
      {action: 'Copy selected item (list focused)', keys: ['↵']},
      {action: 'Copy selected item (detail editor)', keys: ['⌘', '↵']},
      {action: 'Clear selection; hide panel if empty', keys: ['Esc']},
      {action: 'Navigate list up / down', keys: ['↑ / ↓']},
    ],
  },
];
