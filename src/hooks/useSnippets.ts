import {useCallback, useEffect, useMemo, useState} from 'react';
import {Snippet} from '../types';
import {
  loadSnippets,
  addSnippet as addSnippetToStorage,
  deleteSnippet as deleteSnippetFromStorage,
  updateSnippet as updateSnippetInStorage,
} from '../services/snippetStorage';
import {setClipboardString} from '../services/clipboardNative';
import {useCopyFeedback} from './useCopyFeedback';

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const {copiedId, markCopied} = useCopyFeedback();

  useEffect(() => {
    loadSnippets().then(setSnippets);
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
      setClipboardString(contentOverride ?? snippet.content);
      markCopied(snippet.id);
    },
    [markCopied],
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
