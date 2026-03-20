export interface ShortcutRow {
  action: string;
  keys: string[];
}

export interface ShortcutSection {
  title: string;
  rows: ShortcutRow[];
}

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
