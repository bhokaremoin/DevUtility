import AsyncStorage from '@react-native-async-storage/async-storage';
import {CLIPBOARD_STORAGE_KEY} from '../../shared/constants';
import {ClipboardItem} from '../../shared/types';

/**
 * Loads the persisted clipboard history from AsyncStorage.
 *
 * @returns Array of `ClipboardItem` objects, or `[]` on a miss or parse error.
 */
export async function loadClipboardHistory(): Promise<ClipboardItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CLIPBOARD_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as ClipboardItem[];
    }
    return [];
  } catch (error) {
    console.warn('Could not load the clipboard history; starting empty', error);
    return [];
  }
}

/**
 * Persists the current clipboard history to AsyncStorage.
 *
 * @param items - The full history array to serialize and store.
 */
export async function saveClipboardHistory(
  items: ClipboardItem[],
): Promise<void> {
  await AsyncStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(items));
}
