import {describe, expect, it} from '@jest/globals';
import {snippetsEscapeAction} from '../src/tools/snippets/snippetsEscape';

const nothingOpen = {isSheetOpen: false, isAddDialogOpen: false, searchText: '', isInputFocused: false};

describe('snippetsEscapeAction', () => {
  it('closes an open help sheet before anything else', () => {
    const state = {isSheetOpen: true, isAddDialogOpen: true, searchText: 'nginx', isInputFocused: true};
    expect(snippetsEscapeAction(state)).toBe('closeSheet');
  });

  it('closes the add dialog before touching the search', () => {
    expect(snippetsEscapeAction({...nothingOpen, isAddDialogOpen: true, searchText: 'nginx'})).toBe('closeAddDialog');
  });

  it('clears the search text when there is some', () => {
    expect(snippetsEscapeAction({...nothingOpen, searchText: 'nginx', isInputFocused: true})).toBe('clearSearch');
  });

  it('removes focus from an input once the search is empty', () => {
    expect(snippetsEscapeAction({...nothingOpen, isInputFocused: true})).toBe('blurInput');
  });

  it('does nothing otherwise, so Esc never closes Snippets', () => {
    expect(snippetsEscapeAction(nothingOpen)).toBe('none');
  });
});
