import {useCallback, useEffect, useRef, useState} from 'react';
import {COPY_FEEDBACK_DURATION_MS} from './constants';

/**
 * Tracks which item is showing copy feedback and auto-clears after `duration`.
 *
 * @param duration - How long (ms) the feedback badge stays visible.
 *   Defaults to `COPY_FEEDBACK_DURATION_MS`.
 * @returns
 *   - `copiedId` — ID of the item currently showing feedback, or `null`.
 *   - `markCopied` — Call with an item ID to show feedback for that item;
 *     resets any in-flight timer before starting a new one.
 */
export function useCopyFeedback(duration: number = COPY_FEEDBACK_DURATION_MS) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const markCopied = useCallback(
    (id: string) => {
      setCopiedId(id);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setCopiedId(null);
      }, duration);
    },
    [duration],
  );

  return {copiedId, markCopied};
}
