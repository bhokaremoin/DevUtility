import {useCallback, useEffect, useRef, useState} from 'react';
import {MAX_HISTORY_ITEMS} from '../constants';
import {ClipboardItem} from '../types';
import {
  loadClipboardHistory,
  saveClipboardHistory,
} from '../services/clipboardStorage';
import {setClipboardString} from '../services/clipboardNative';
import {generateId} from '../utils';
import {useCopyFeedback} from './useCopyFeedback';
import {useClipboardPoller} from './useClipboardPoller';

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
    setHistory(prev => {
      const newItem: ClipboardItem = {
        id: generateId(),
        text,
        timestamp: Date.now(),
      };
      return [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
    });
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
