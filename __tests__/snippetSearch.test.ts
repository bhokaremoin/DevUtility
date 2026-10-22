import {describe, expect, it} from '@jest/globals';
import {filterSnippets} from '../src/hooks/snippetSearch';
import {Snippet} from '../src/types';

function makeSnippet(overrides: Partial<Snippet>): Snippet {
  return {id: 'id', title: '', description: '', content: '', tags: [], createdAt: 0, ...overrides};
}

const nginx = makeSnippet({id: '1', title: 'Nginx proxy', description: 'reverse proxy', tags: ['web'], content: 'server {}'});
const cpp = makeSnippet({id: '2', title: 'Build c++ app', description: '', tags: ['native'], content: 'make'});

describe('filterSnippets', () => {
  it('returns every snippet for a blank query', () => {
    expect(filterSnippets([nginx, cpp], '   ')).toEqual([nginx, cpp]);
  });

  it('matches title, description and tags case-insensitively', () => {
    expect(filterSnippets([nginx, cpp], 'NGINX')).toEqual([nginx]);
    expect(filterSnippets([nginx, cpp], 'Reverse')).toEqual([nginx]);
    expect(filterSnippets([nginx, cpp], 'NATIVE')).toEqual([cpp]);
  });

  it('does not match content', () => {
    expect(filterSnippets([nginx, cpp], 'server')).toEqual([]);
  });

  it('treats regex characters literally', () => {
    expect(filterSnippets([nginx, cpp], 'c++')).toEqual([cpp]);
  });
});
