import AsyncStorage from '@react-native-async-storage/async-storage';
import {SNIPPETS_STORAGE_KEY} from '../constants';
import {Snippet} from '../types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

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

export async function saveSnippets(snippets: Snippet[]): Promise<void> {
  await AsyncStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(snippets));
}

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

export async function deleteSnippet(id: string): Promise<Snippet[]> {
  const existing = await loadSnippets();
  const updated = existing.filter(s => s.id !== id);
  await saveSnippets(updated);
  return updated;
}
