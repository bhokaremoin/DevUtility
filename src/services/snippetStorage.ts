/**
 * @file services/snippetStorage.ts
 * @description AsyncStorage persistence layer for the Snippets feature.
 *
 * Architecture Role: All snippet CRUD operations go through this module.
 * Each mutating function (add/delete/update) reads the current list, applies
 * the change, writes it back atomically, and returns the updated array so
 * callers never hold a stale reference.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {SNIPPETS_STORAGE_KEY} from '../constants';
import {Snippet} from '../types';
import {generateId} from '../utils';

/**
 * Loads all persisted snippets from AsyncStorage.
 *
 * @returns Array of `Snippet` objects, or `[]` on a miss or parse error.
 */
export async function loadSnippets(): Promise<Snippet[]> {
  try {
    const raw = await AsyncStorage.getItem(SNIPPETS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as Snippet[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Serializes and writes the full snippets array to AsyncStorage.
 *
 * @param snippets - The complete list to persist.
 */
export async function saveSnippets(snippets: Snippet[]): Promise<void> {
  await AsyncStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(snippets));
}

/**
 * Creates a new snippet, prepends it to the stored list, and persists.
 *
 * @param data - All snippet fields except `id` and `createdAt` (auto-assigned).
 * @returns The newly created `Snippet` with its generated `id` and `createdAt`.
 */
export async function addSnippet(
  data: Omit<Snippet, 'id' | 'createdAt'>,
): Promise<Snippet> {
  const snippet: Snippet = {
    ...data,
    id: generateId(),
    createdAt: Date.now(),
  };
  const existing = await loadSnippets();
  const updated = [snippet, ...existing];
  await saveSnippets(updated);
  return snippet;
}

/**
 * Removes a snippet by ID and persists the result.
 *
 * @param id - The `id` of the snippet to remove.
 * @returns The updated snippets array after deletion.
 */
export async function deleteSnippet(id: string): Promise<Snippet[]> {
  const existing = await loadSnippets();
  const updated = existing.filter(s => s.id !== id);
  await saveSnippets(updated);
  return updated;
}

/**
 * Updates the `content` field of a single snippet and persists.
 *
 * @param id - The `id` of the snippet to update.
 * @param content - The new content string to store.
 * @returns The updated snippets array after the change.
 */
export async function updateSnippet(
  id: string,
  content: string,
): Promise<Snippet[]> {
  const existing = await loadSnippets();
  const updated = existing.map(s => (s.id === id ? {...s, content} : s));
  await saveSnippets(updated);
  return updated;
}
