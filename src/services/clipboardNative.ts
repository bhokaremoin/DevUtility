/**
 * @file services/clipboardNative.ts
 * @description Thin adapter over the React Native clipboard native module.
 *
 * Architecture Role: Isolates clipboard NativeModule access behind two simple
 * async/sync functions so the rest of the app never imports NativeModules
 * directly. Falls back gracefully when the module is unavailable (e.g. tests).
 */

import {NativeModules} from 'react-native';

// Supports both the community @react-native-clipboard package (RNCClipboard)
// and the legacy bundled module (Clipboard) for compatibility.
const ClipboardModule =
  NativeModules.RNCClipboard ?? NativeModules.Clipboard ?? null;

/**
 * Reads the current system clipboard content.
 *
 * @returns The clipboard string, or `''` if unavailable or empty.
 */
export async function getClipboardString(): Promise<string> {
  if (!ClipboardModule?.getString) {
    return '';
  }
  return ClipboardModule.getString();
}

/**
 * Writes a string to the system clipboard.
 *
 * @param content - The text to place on the clipboard.
 */
export function setClipboardString(content: string): void {
  ClipboardModule?.setString?.(content);
}
