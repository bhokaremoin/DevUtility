import {addCapturedText} from '../src/hooks/clipboardHistoryList';
import {ClipboardItem} from '../src/types';

let nextId = 0;
const createItem = (text: string): ClipboardItem => ({id: String(nextId++), text, timestamp: 0});

describe('addCapturedText', () => {
  it('puts the new text first', () => {
    const history = [createItem('old')];
    expect(addCapturedText(history, 'new', createItem, 15).map(item => item.text)).toEqual(['new', 'old']);
  });

  it('keeps only the newest maxItems entries', () => {
    const history = Array.from({length: 15}, (_, index) => createItem(`item ${index}`));
    const updated = addCapturedText(history, 'newest', createItem, 15);
    expect(updated).toHaveLength(15);
    expect(updated[0].text).toBe('newest');
    expect(updated[14].text).toBe('item 13');
  });
});
