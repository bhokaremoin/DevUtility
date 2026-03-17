import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {NativeModules} from 'react-native';
import {Snippet} from '../types';
import {
  loadSnippets,
  addSnippet as addSnippetToStorage,
  deleteSnippet as deleteSnippetFromStorage,
  updateSnippet as updateSnippetInStorage,
} from '../services/snippetStorage';
import {COPY_FEEDBACK_DURATION_MS} from '../constants';

const ClipboardModule =
  NativeModules.RNCClipboard ?? NativeModules.Clipboard ?? null;

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadSnippets().then(setSnippets);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const filteredSnippets = useMemo(() => {
    if (!searchQuery.trim()) {
      return snippets;
    }
    const q = searchQuery.toLowerCase();
    return snippets.filter(
      s =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(tag => tag.toLowerCase().includes(q)),
    );
  }, [snippets, searchQuery]);

  const addSnippet = useCallback(
    async (data: Omit<Snippet, 'id' | 'createdAt'>) => {
      const created = await addSnippetToStorage(data);
      setSnippets(prev => [created, ...prev]);
    },
    [],
  );

  const removeSnippet = useCallback(async (id: string) => {
    const updated = await deleteSnippetFromStorage(id);
    setSnippets(updated);
  }, []);

  const copySnippet = useCallback(
    (snippet: Snippet, contentOverride?: string) => {
      ClipboardModule?.setString?.(contentOverride ?? snippet.content);
      setCopiedId(snippet.id);
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = setTimeout(() => {
        setCopiedId(null);
      }, COPY_FEEDBACK_DURATION_MS);
    },
    [],
  );

  const updateSnippetContent = useCallback(
    async (id: string, content: string) => {
      const updated = await updateSnippetInStorage(id, content);
      setSnippets(updated);
    },
    [],
  );

  return {
    snippets: filteredSnippets,
    searchQuery,
    setSearchQuery,
    copiedId,
    addSnippet,
    removeSnippet,
    copySnippet,
    updateSnippetContent,
  };
}
