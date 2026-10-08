import { beforeEach, describe, expect, it } from 'vitest';
import { migratePersistedState, useAppStore } from '../src/store';

describe('migratePersistedState', () => {
  it('strips unimplemented tools from version 0 state', () => {
    const migrated = migratePersistedState(
      {
        agents: [{ id: 'a', name: 'A', role: 'r', systemPrompt: 'p', tools: ['Web Search', 'Read from Google Drive'] }],
        workflows: [{ id: 'w', name: 'W', task: 't', memory: '', tools: ['Gmail', 'Google Docs'], agentsPermitted: [] }],
        chatSessions: [],
      },
      0,
    ) as any;
    expect(migrated.agents[0].tools).toEqual(['Google Drive']);
    expect(migrated.workflows[0].tools).toEqual(['Google Docs']);
    expect(migrated.chatSessions).toEqual([]);
  });

  it('leaves current-version state alone', () => {
    const state = { agents: [{ tools: ['Anything'] }] };
    expect(migratePersistedState(state, 1)).toBe(state);
  });
});

describe('store', () => {
  beforeEach(() => {
    useAppStore.setState({ chatSessions: [], currentSessionId: null, executions: [] });
  });

  it('seeds only implemented tools', () => {
    const { agents, workflows } = useAppStore.getState();
    const tools = [...agents, ...workflows].flatMap(x => x.tools);
    expect(new Set(tools)).toEqual(new Set(['Google Drive', 'Google Docs']));
  });

  it('adds a session, appends messages and logs, and updates content', () => {
    const s = useAppStore.getState();
    s.addChatSession({ id: 's1', title: 'T', date: '2026-04-12', messages: [] });
    s.addMessageToSession('s1', { id: 'm1', role: 'assistant', content: '', logs: [] });
    s.updateMessageLogs('s1', 'm1', { step: 'Master Agent', output: 'routing' });
    s.updateMessageContent('s1', 'm1', 'done');

    const state = useAppStore.getState();
    expect(state.currentSessionId).toBe('s1');
    expect(state.chatSessions[0].messages[0]).toEqual({
      id: 'm1',
      role: 'assistant',
      content: 'done',
      logs: [{ step: 'Master Agent', output: 'routing' }],
    });
  });

  it('tracks execution status and logs', () => {
    const s = useAppStore.getState();
    s.addExecution({ id: 'e1', workflowId: 'wf-1', workflowName: 'W', status: 'running', startTime: 't0', logs: [], triggerInput: 'go' });
    s.addExecutionLog('e1', { step: 'Agent', output: 'ok', timestamp: 't1' });
    s.updateExecution('e1', { status: 'completed', endTime: 't2' });

    const [exec] = useAppStore.getState().executions;
    expect(exec.status).toBe('completed');
    expect(exec.logs).toHaveLength(1);
  });
});
