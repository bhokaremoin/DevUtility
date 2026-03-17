import AsyncStorage from '@react-native-async-storage/async-storage';
import {CLIPBOARD_STORAGE_KEY} from '../constants';
import {ClipboardItem} from '../types';

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

export async function saveClipboardHistory(
  items: ClipboardItem[],
): Promise<void> {
  await AsyncStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(items));
}
