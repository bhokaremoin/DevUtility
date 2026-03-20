/**
 * @file hooks/useClipboardPoller.ts
 * @description React hook that polls the system clipboard on a fixed interval
 * and fires a callback whenever the content changes.
 *
 * Architecture Role: Low-level polling primitive consumed exclusively by
 * `useClipboardHistory`. Isolating polling here keeps the history hook focused
 * on state management and avoids duplicating interval logic.
 */

import {MutableRefObject, useEffect, useRef} from 'react';
import {CLIPBOARD_POLL_INTERVAL_MS} from '../constants';
import {getClipboardString} from '../services/clipboardNative';

/**
 * Polls the system clipboard every `CLIPBOARD_POLL_INTERVAL_MS` milliseconds.
 * Fires `onNewText` only when the clipboard content differs from the last
 * known value stored in `lastClipRef`.
 *
 * @param lastClipRef - A ref shared with the caller that tracks the most
 *   recently seen clipboard string, preventing duplicate callbacks.
 * @param onNewText - Callback invoked with the new clipboard string whenever
 *   a change is detected. Wrapped in a ref internally so subscriptions don't
 *   need to be recreated when the callback identity changes.
 */
export function useClipboardPoller(
  lastClipRef: MutableRefObject<string>,
  onNewText: (text: string) => void,
): void {
  const onNewTextRef = useRef(onNewText);
  onNewTextRef.current = onNewText;

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const content = await getClipboardString();
        if (content && content !== lastClipRef.current) {
          lastClipRef.current = content;
          onNewTextRef.current(content);
        }
      } catch {
        // Clipboard access can fail silently — nothing to surface here.
      }
    }, CLIPBOARD_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [lastClipRef]);
}
