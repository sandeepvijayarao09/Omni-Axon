import { describe, expect, it } from 'vitest';
import { MAX_TEXT, validateClassify, validateGenerateAgent, validateRunAgent } from '../server/validate';

describe('validateClassify', () => {
  it('accepts a minimal request and defaults optional fields', () => {
    expect(validateClassify({ input: 'hello' })).toEqual({ value: { input: 'hello', workflows: [], chatHistory: '' } });
  });

  it('keeps only id, name and task from workflows', () => {
    const result = validateClassify({
      input: 'hi',
      workflows: [{ id: 'wf-1', name: 'A', task: 'B', agentsPermitted: ['x'] }],
    });
    expect(result).toEqual({ value: { input: 'hi', chatHistory: '', workflows: [{ id: 'wf-1', name: 'A', task: 'B' }] } });
  });

  it('rejects bad input', () => {
    expect(validateClassify(null)).toHaveProperty('error');
    expect(validateClassify({ input: '   ' })).toEqual({ error: 'input is required' });
    expect(validateClassify({ input: 5 })).toEqual({ error: 'input must be a string' });
    expect(validateClassify({ input: 'x', workflows: 'nope' })).toEqual({ error: 'workflows must be an array' });
    expect(validateClassify({ input: 'x', workflows: [{ id: 1 }] })).toHaveProperty('error');
    expect(validateClassify({ input: 'x'.repeat(MAX_TEXT + 1) })).toEqual({ error: 'input is too long' });
  });
});

describe('validateGenerateAgent', () => {
  it('requires a prompt', () => {
    expect(validateGenerateAgent({ prompt: 'SQL tutor' })).toEqual({ value: { prompt: 'SQL tutor' } });
    expect(validateGenerateAgent({})).toEqual({ error: 'prompt must be a string' });
  });
});

describe('validateRunAgent', () => {
  it('requires systemPrompt and input', () => {
    expect(validateRunAgent({ systemPrompt: 'Be terse.', input: 'data' })).toEqual({
      value: { systemPrompt: 'Be terse.', input: 'data', chatHistory: '' },
    });
    expect(validateRunAgent({ input: 'data' })).toEqual({ error: 'systemPrompt must be a string' });
    expect(validateRunAgent({ systemPrompt: 'x', input: '' })).toEqual({ error: 'input is required' });
  });
});
