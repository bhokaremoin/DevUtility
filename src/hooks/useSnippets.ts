/**
 * @file hooks/useSnippets.ts
 * @description React hook that owns all snippet state and exposes CRUD and
 * search operations for the SnippetManager screen.
 *
 * Architecture Role: Primary data layer for snippets. Loads from AsyncStorage
 * on mount, maintains a search query for client-side filtering, and delegates
 * persistence to `snippetStorage`. Composes `useCopyFeedback` for copy-state UI.
 */

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

/**
 * Manages snippet list state: loads on mount, filters by search query,
 * and provides add/remove/copy/update operations.
 *
 * @returns An object containing:
 *   - `snippets` — filtered list of snippets (all snippets when query is empty).
 *   - `searchQuery` / `setSearchQuery` — current filter string and its setter.
 *   - `copiedId` — ID of the snippet showing copy-feedback, or `null`.
 *   - `addSnippet` — creates and persists a new snippet.
 *   - `removeSnippet` — deletes a snippet by ID.
 *   - `copySnippet` — copies snippet content to clipboard and triggers feedback.
 *   - `updateSnippetContent` — saves an edited content string.
 */
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
