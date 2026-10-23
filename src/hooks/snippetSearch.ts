import {Snippet} from '../types';

// Matches today's behavior exactly: the blank check trims, the search itself does not.
export function filterSnippets(snippets: Snippet[], query: string): Snippet[] {
  if (!query.trim()) {
    return snippets;
  }
  const normalizedQuery = query.toLowerCase();
  return snippets.filter(
    snippet =>
      snippet.title.toLowerCase().includes(normalizedQuery) ||
      snippet.description.toLowerCase().includes(normalizedQuery) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(normalizedQuery)),
  );
}
