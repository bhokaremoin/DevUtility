import {ShortcutSection} from '../../shared/shortcuts';

export const CLIPBOARD_SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'From any app',
    rows: [{action: 'Open / close Clipboard', keys: ['⌃', '⌥', 'V']}],
  },
  {
    title: 'In Clipboard',
    rows: [
      {action: 'Move selection', keys: ['↑ / ↓']},
      {action: 'Copy selected', keys: ['↵']},
      {action: 'Copy stored text', keys: ['⌘', '↵']},
      {action: 'Stop editing / close', keys: ['Esc']},
      {action: 'Open Settings', keys: ['⌘', ',']},
    ],
  },
];
