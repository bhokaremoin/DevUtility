/**
 * @file services/clipboardStorage.ts
 * @description AsyncStorage persistence layer for clipboard history.
 *
 * Architecture Role: Owns the read/write contract for clipboard data.
 * Called by `useClipboardHistory` on mount (load) and whenever history
 * state changes (save). Errors during load are swallowed to avoid crashing
 * on a cold start with corrupt storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {CLIPBOARD_STORAGE_KEY} from '../constants';
import {ClipboardItem} from '../types';

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
  } catch {
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
