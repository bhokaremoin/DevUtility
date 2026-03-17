export interface ClipboardItem {
  id: string;
  text: string;
  timestamp: number;
}

export interface Snippet {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  createdAt: number;
}
