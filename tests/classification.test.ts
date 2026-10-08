import { describe, expect, it } from 'vitest';
import { FALLBACK_CLASSIFICATION, parseClassification } from '../server/classification';

describe('parseClassification', () => {
  it('falls back to chat on empty or invalid JSON', () => {
    expect(parseClassification(undefined)).toEqual(FALLBACK_CLASSIFICATION);
    expect(parseClassification('not json')).toEqual(FALLBACK_CLASSIFICATION);
    expect(parseClassification('[1,2]')).toEqual(FALLBACK_CLASSIFICATION);
  });

  it('passes through a chat answer', () => {
    expect(parseClassification('{"intent":"chat","chatResponse":"Paris."}')).toEqual({
      intent: 'chat',
      chatResponse: 'Paris.',
    });
  });

  it('treats an unknown intent as chat', () => {
    expect(parseClassification('{"intent":"dance","chatResponse":"ok"}')).toEqual({ intent: 'chat', chatResponse: 'ok' });
  });

  it('accepts a workflow only if the ID exists', () => {
    const text = '{"intent":"workflow","workflowId":"wf-1"}';
    expect(parseClassification(text, ['wf-1'])).toEqual({ intent: 'workflow', workflowId: 'wf-1' });
    expect(parseClassification(text, ['wf-2']).intent).toBe('chat');
  });

  it('cleans dynamic agents and strips unimplemented tools', () => {
    const text = JSON.stringify({
      intent: 'dynamic_task',
      dynamicTaskName: 'Market brief',
      dynamicAgents: [
        { name: 'Scout', role: 'Researcher', systemPrompt: 'Find facts.', tools: ['Web Search', 'Google Drive'] },
        { tools: ['Gmail'] },
        'garbage',
      ],
    });
    expect(parseClassification(text)).toEqual({
      intent: 'dynamic_task',
      dynamicTaskName: 'Market brief',
      dynamicAgents: [
        { name: 'Scout', role: 'Researcher', systemPrompt: 'Find facts.', tools: ['Google Drive'] },
        { name: 'Agent 2', role: 'Assistant', systemPrompt: 'You are a helpful assistant.', tools: [] },
      ],
    });
  });

  it('names an unnamed dynamic task', () => {
    expect(parseClassification('{"intent":"dynamic_task"}')).toEqual({
      intent: 'dynamic_task',
      dynamicTaskName: 'Ad-hoc Task',
      dynamicAgents: [],
    });
  });
});
