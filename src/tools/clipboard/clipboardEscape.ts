export type ClipboardEscapeAction = 'closeSheet' | 'blurEditor' | 'hidePanel';

interface ClipboardEscapeState {
  isSheetOpen: boolean;
  isEditorFocused: boolean;
}

/** What Esc does in Clipboard: the first that applies, in this order. */
export function clipboardEscapeAction({isSheetOpen, isEditorFocused}: ClipboardEscapeState): ClipboardEscapeAction {
  if (isSheetOpen) {
    return 'closeSheet';
  }
  if (isEditorFocused) {
    return 'blurEditor';
  }
  return 'hidePanel';
}
