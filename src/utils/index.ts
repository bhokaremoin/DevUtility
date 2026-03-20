export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}

export function parseTags(tagString: string): string[] {
  return tagString.split(',').map(t => t.trim()).filter(Boolean);
}

export function formatContentStats(content: string): string {
  return `${content.length.toLocaleString()} chars / ${content.split('\n').length.toLocaleString()} lines`;
}
