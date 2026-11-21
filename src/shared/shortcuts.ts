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
