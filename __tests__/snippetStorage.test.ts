import AsyncStorage from '@react-native-async-storage/async-storage';
import {addSnippet, deleteSnippet, loadSnippets, updateSnippet} from '../src/services/snippetStorage';
import {SNIPPETS_STORAGE_KEY} from '../src/constants';

beforeEach(() => AsyncStorage.clear());

const draft = {title: 'T', description: 'D', content: 'C', tags: ['x']};

describe('snippet storage', () => {
  it('adds new snippets to the front with an id and creation time', async () => {
    const first = await addSnippet(draft);
    const second = await addSnippet({...draft, title: 'T2'});
    const stored = await loadSnippets();
    expect(stored.map(snippet => snippet.id)).toEqual([second.id, first.id]);
    expect(first.createdAt).toEqual(expect.any(Number));
  });

  it('deletes a snippet by id', async () => {
    const snippet = await addSnippet(draft);
    await expect(deleteSnippet(snippet.id)).resolves.toEqual([]);
  });

  it('updates only the content', async () => {
    const snippet = await addSnippet(draft);
    const [updated] = await updateSnippet(snippet.id, 'new content');
    expect(updated).toEqual({...snippet, content: 'new content'});
  });

  it('returns an empty list when stored data is corrupt', async () => {
    await AsyncStorage.setItem(SNIPPETS_STORAGE_KEY, 'corrupt');
    await expect(loadSnippets()).resolves.toEqual([]);
  });
});
