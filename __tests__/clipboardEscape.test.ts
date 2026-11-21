import {describe, expect, it} from '@jest/globals';
import {clipboardEscapeAction} from '../src/tools/clipboard/clipboardEscape';

describe('clipboardEscapeAction', () => {
  it('closes an open help sheet first', () => {
    expect(clipboardEscapeAction({isSheetOpen: true, isEditorFocused: true})).toBe('closeSheet');
  });

  it('stops editing the detail text when the editor has focus', () => {
    expect(clipboardEscapeAction({isSheetOpen: false, isEditorFocused: true})).toBe('blurEditor');
  });

  it('closes the panel when nothing else is open or focused', () => {
    expect(clipboardEscapeAction({isSheetOpen: false, isEditorFocused: false})).toBe('hidePanel');
  });
});
