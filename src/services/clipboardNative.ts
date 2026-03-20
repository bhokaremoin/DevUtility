import {NativeModules} from 'react-native';

const ClipboardModule =
  NativeModules.RNCClipboard ?? NativeModules.Clipboard ?? null;

export async function getClipboardString(): Promise<string> {
  if (!ClipboardModule?.getString) {
    return '';
  }
  return ClipboardModule.getString();
}

export function setClipboardString(content: string): void {
  ClipboardModule?.setString?.(content);
}
