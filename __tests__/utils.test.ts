import {formatContentStats, parseTags, truncateText} from '../src/utils';

describe('truncateText', () => {
  it('returns text unchanged when within the limit', () => {
    expect(truncateText('hello', 5)).toBe('hello');
  });

  it('cuts text to the limit and appends an ellipsis', () => {
    expect(truncateText('hello world', 5)).toBe('hello…');
  });
});

describe('parseTags', () => {
  it('splits on commas, trims and drops empty tags', () => {
    expect(parseTags(' nginx, docker ,, devops ')).toEqual(['nginx', 'docker', 'devops']);
  });
});

describe('formatContentStats', () => {
  it('counts characters and lines', () => {
    expect(formatContentStats('ab\ncd')).toBe('5 chars / 2 lines');
  });
});
