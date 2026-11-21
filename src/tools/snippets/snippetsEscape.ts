export type SnippetsEscapeAction = 'closeSheet' | 'closeAddDialog' | 'clearSearch' | 'blurInput' | 'none';

interface SnippetsEscapeState {
  isSheetOpen: boolean;
  isAddDialogOpen: boolean;
  searchText: string;
  isInputFocused: boolean;
}

/** What Esc does in Snippets: the first that applies, in this order. Esc never closes Snippets. */
export function snippetsEscapeAction({
  isSheetOpen,
  isAddDialogOpen,
  searchText,
  isInputFocused,
}: SnippetsEscapeState): SnippetsEscapeAction {
  if (isSheetOpen) {
    return 'closeSheet';
  }
  if (isAddDialogOpen) {
    return 'closeAddDialog';
  }
  if (searchText.length > 0) {
    return 'clearSearch';
  }
  if (isInputFocused) {
    return 'blurInput';
  }
  return 'none';
}
