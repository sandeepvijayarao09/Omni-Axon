import { describe, expect, it } from 'vitest';
import { hasTool, IMPLEMENTED_TOOLS, normalizeTools } from '../src/lib/tools';

describe('normalizeTools', () => {
  it('keeps implemented tools and maps legacy labels', () => {
    expect(normalizeTools(['Read from Google Drive', 'Write to Google Docs'])).toEqual(['Google Drive', 'Google Docs']);
  });

  it('drops tools that have no implementation', () => {
    expect(normalizeTools(['Web Search', 'Gmail', 'Google Drive', 'Jira'])).toEqual(['Google Drive']);
  });

  it('dedupes, ignores case and whitespace, and skips non-strings', () => {
    expect(normalizeTools([' google docs ', 'Google Docs', 42, null])).toEqual(['Google Docs']);
  });

  it('returns an empty list for non-array input', () => {
    expect(normalizeTools(undefined)).toEqual([]);
    expect(normalizeTools('Google Drive')).toEqual([]);
  });

  it('only exposes Drive and Docs', () => {
    expect(IMPLEMENTED_TOOLS).toEqual(['Google Drive', 'Google Docs']);
  });
});

describe('hasTool', () => {
  it('recognizes legacy labels', () => {
    expect(hasTool(['Read from Google Drive'], 'Google Drive')).toBe(true);
    expect(hasTool(['Read from Google Drive'], 'Google Docs')).toBe(false);
  });
});
