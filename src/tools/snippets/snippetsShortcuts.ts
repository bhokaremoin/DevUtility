import {ShortcutSection} from '../../shared/shortcuts';

export const SNIPPETS_SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'From any app',
    rows: [{action: 'Open / close Snippets', keys: ['⌃', '⌥', 'S']}],
  },
  {
    title: 'In Snippets',
    rows: [
      {action: 'Move selection', keys: ['↑ / ↓']},
      {action: 'Focus search', keys: ['⌘', 'F']},
      {action: 'Copy selected', keys: ['↵']},
      {action: 'Copy stored text', keys: ['⌘', '↵']},
      {action: 'Clear search / stop editing', keys: ['Esc']},
      {action: 'Open Settings', keys: ['⌘', ',']},
    ],
  },
];
