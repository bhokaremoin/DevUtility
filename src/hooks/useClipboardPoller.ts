import {MutableRefObject, useEffect, useRef} from 'react';
import {CLIPBOARD_POLL_INTERVAL_MS} from '../constants';
import {getClipboardString} from '../services/clipboardNative';

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
