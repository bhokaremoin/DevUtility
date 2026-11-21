import {useCallback, useEffect, useRef, useState} from 'react';
import {MAX_HISTORY_ITEMS} from '../../shared/constants';
import {ClipboardItem} from '../../shared/types';
import {
  loadClipboardHistory,
  saveClipboardHistory,
} from './clipboardStorage';
import {setClipboardString} from '../../shared/clipboardNative';
import {generateId} from '../../shared/utils';
import {useCopyFeedback} from '../../shared/useCopyFeedback';
import {useClipboardPoller} from './useClipboardPoller';
import {addCapturedText} from './clipboardHistoryList';

/**
 * Manages clipboard history: loads persisted items on mount, polls the system
 * clipboard for new content, persists changes, and provides copy/edit/clear ops.
 *
 * @returns An object containing:
 *   - `history` — ordered array of captured clipboard items (newest first).
 *   - `copiedId` — ID of the item currently showing copy-feedback, or `null`.
 *   - `copyToClipboard` — writes an item (or draft override) to the clipboard.
 *   - `updateItemText` — edits the stored text of an existing item.
 *   - `clearHistory` — removes all items from history.
 */
export function useClipboardHistory() {
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const lastClipRef = useRef<string>('');
  const initializedRef = useRef(false);
  const {copiedId, markCopied} = useCopyFeedback();

  // Load persisted history on mount
  useEffect(() => {
    loadClipboardHistory().then(persisted => {
      if (persisted.length > 0) {
        setHistory(persisted);
        lastClipRef.current = persisted[0].text;
      }
      initializedRef.current = true;
    });
  }, []);

  // Persist history whenever it changes (skip before initial load completes)
  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }
    saveClipboardHistory(history);
  }, [history]);

  // Poll the system clipboard for new content
  const handleNewClip = useCallback((text: string) => {
    setHistory(previous =>
      addCapturedText(
        previous,
        text,
        capturedText => ({
          id: generateId(),
          text: capturedText,
          timestamp: Date.now(),
        }),
        MAX_HISTORY_ITEMS,
      ),
    );
  }, []);
  useClipboardPoller(lastClipRef, handleNewClip);

  const copyToClipboard = useCallback(
    (item: ClipboardItem, textOverride?: string) => {
      const textToCopy = textOverride ?? item.text;
      setClipboardString(textToCopy);
      lastClipRef.current = textToCopy;
      markCopied(item.id);
    },
    [markCopied],
  );

  const updateItemText = useCallback((id: string, text: string) => {
    setHistory(prev => prev.map(h => (h.id === id ? {...h, text} : h)));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {history, copiedId, copyToClipboard, updateItemText, clearHistory};
}
