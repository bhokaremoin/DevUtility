import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {loadClipboardHistory, saveClipboardHistory} from '../src/tools/clipboard/clipboardStorage';
import {CLIPBOARD_STORAGE_KEY} from '../src/shared/constants';

beforeEach(() => AsyncStorage.clear());

describe('clipboard storage', () => {
  it('round-trips saved history', async () => {
    const items = [{id: '1', text: 'hello', timestamp: 1}];
    await saveClipboardHistory(items);
    await expect(loadClipboardHistory()).resolves.toEqual(items);
  });

  it('returns an empty list when nothing is stored', async () => {
    await expect(loadClipboardHistory()).resolves.toEqual([]);
  });

  it('returns an empty list and logs a warning when stored data is corrupt', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await AsyncStorage.setItem(CLIPBOARD_STORAGE_KEY, '{not json');
    await expect(loadClipboardHistory()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Could not load the clipboard history'), expect.anything());
    warn.mockRestore();
  });
});
