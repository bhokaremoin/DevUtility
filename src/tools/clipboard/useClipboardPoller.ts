import {MutableRefObject, useEffect, useRef} from 'react';
import {CLIPBOARD_POLL_INTERVAL_MS} from '../../shared/constants';
import {getClipboardString} from '../../shared/clipboardNative';

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
