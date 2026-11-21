/** A single entry in the clipboard history list. */
export interface ClipboardItem {
  /** Unique identifier (timestamp + random suffix via `generateId`). */
  id: string;
  /** The raw text content captured from the system clipboard. */
  text: string;
  /** Unix epoch milliseconds when this item was captured. */
  timestamp: number;
}

/** A saved code/text snippet managed by the Snippets feature. */
export interface Snippet {
  /** Unique identifier (timestamp + random suffix via `generateId`). */
  id: string;
  /** Short human-readable name displayed in the master list. */
  title: string;
  /** Optional longer description shown in the detail view. */
  description: string;
  /** The actual code or text content that gets copied. */
  content: string;
  /** Searchable tags, e.g. `['nginx', 'docker']`. */
  tags: string[];
  /** Unix epoch milliseconds when this snippet was first created. */
  createdAt: number;
}

/**
 * An imperative handle exposed by each screen via `useImperativeHandle`,
 * allowing the root `App.tsx` keyboard-shortcut dispatcher to call screen
 * actions without lifting all state to the top level.
 *
 * All methods are optional; screens implement only the subset they support.
 */
export interface ScreenHandle {
  /** Copy the currently selected list item to the clipboard. */
  copySelected?: () => void;
  /** The current search text, for screens with a search field. */
  searchText?: () => string;
  /** Whether the "Add Snippet" dialog is open. */
  isAddDialogOpen?: () => boolean;
  closeAddDialog?: () => void;
  clearSearch?: () => void;
  /** Move keyboard focus into the screen's search input. */
  focusSearch?: () => void;
  /** Remove focus from all inputs within the screen. */
  blurAll?: () => void;
  /** Open the "Add Snippet" modal programmatically. */
  openAddModal?: () => void;
  /** Move the list selection one item upward. */
  navigateUp?: () => void;
  /** Move the list selection one item downward. */
  navigateDown?: () => void;
}
