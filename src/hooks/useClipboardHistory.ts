import {useCallback, useEffect, useRef, useState} from 'react';
import {NativeModules} from 'react-native';
import {
  MAX_HISTORY_ITEMS,
  CLIPBOARD_POLL_INTERVAL_MS,
  COPY_FEEDBACK_DURATION_MS,
} from '../constants';
import {ClipboardItem} from '../types';

const ClipboardModule =
  NativeModules.RNCClipboard ?? NativeModules.Clipboard ?? null;

async function getClipboardString(): Promise<string> {
  if (!ClipboardModule?.getString) {
    return '';
  }
  return ClipboardModule.getString();
}

function setClipboardString(content: string): void {
  ClipboardModule?.setString?.(content);
}

export function useClipboardHistory() {
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const lastClipRef = useRef<string>('');
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const content = await getClipboardString();
        if (content && content !== lastClipRef.current) {
          lastClipRef.current = content;
          setHistory(prev => {
            const newItem: ClipboardItem = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              text: content,
              timestamp: Date.now(),
            };
            const updated = [newItem, ...prev];
            return updated.slice(0, MAX_HISTORY_ITEMS);
          });
        }
      } catch {
        // Clipboard access can fail silently — nothing to surface here.
      }
    }, CLIPBOARD_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const copyToClipboard = useCallback((item: ClipboardItem) => {
    setClipboardString(item.text);
    lastClipRef.current = item.text;

    setCopiedId(item.id);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setCopiedId(null);
    }, COPY_FEEDBACK_DURATION_MS);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {history, copiedId, copyToClipboard, clearHistory};
}
