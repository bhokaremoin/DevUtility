import {useCallback, useEffect, useRef, useState} from 'react';
import {COPY_FEEDBACK_DURATION_MS} from '../constants';

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
