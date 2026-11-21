import {ClipboardItem} from '../../shared/types';

export function addCapturedText(
  history: ClipboardItem[],
  text: string,
  createItem: (text: string) => ClipboardItem,
  maxItems: number,
): ClipboardItem[] {
  return [createItem(text), ...history].slice(0, maxItems);
}
