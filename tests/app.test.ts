import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../server/app';
import type { GeminiService } from '../server/gemini';

let server: Server | undefined;

afterEach(() => {
  server?.close();
  server = undefined;
});

async function start(gemini: GeminiService | null) {
  server = createApp({ gemini }).listen(0);
  await new Promise(resolve => server!.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  return (path: string, body?: unknown) =>
    fetch(`http://127.0.0.1:${port}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
}

function fakeGemini(): GeminiService {
  return {
    classify: vi.fn(async () => ({ intent: 'chat' as const, chatResponse: 'Hi there' })),
    generateAgent: vi.fn(async () => ({ name: 'Tutor', role: 'Teacher', systemPrompt: 'Teach.' })),
    runAgent: vi.fn(async () => 'processed'),
  };
}

describe('Gemini routes', () => {
  it('reports whether a key is configured', async () => {
    const call = await start(null);
    const res = await call('/api/health');
    expect(await res.json()).toMatchObject({ gemini: false });
  });

  it('returns 503 without a key, after validating the body', async () => {
    const call = await start(null);
    expect((await call('/api/classify', {})).status).toBe(400);
    const res = await call('/api/classify', { input: 'hello' });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/GEMINI_API_KEY/);
  });

  it('classifies with only the workflow summary fields', async () => {
    const gemini = fakeGemini();
    const call = await start(gemini);
    const res = await call('/api/classify', {
      input: 'hello',
      workflows: [{ id: 'wf-1', name: 'Writer', task: 'Write', tools: ['x'] }],
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ intent: 'chat', chatResponse: 'Hi there' });
    expect(gemini.classify).toHaveBeenCalledWith({
      input: 'hello',
      chatHistory: '',
      workflows: [{ id: 'wf-1', name: 'Writer', task: 'Write' }],
    });
  });

  it('runs one agent step', async () => {
    const gemini = fakeGemini();
    const call = await start(gemini);
    const res = await call('/api/run-agent', { systemPrompt: 'Summarize.', input: 'long text', chatHistory: 'USER: hi' });
    expect(await res.json()).toEqual({ output: 'processed' });
    expect(gemini.runAgent).toHaveBeenCalledWith({ systemPrompt: 'Summarize.', input: 'long text', chatHistory: 'USER: hi' });
  });

  it('generates an agent profile', async () => {
    const call = await start(fakeGemini());
    const res = await call('/api/generate-agent', { prompt: 'a tutor' });
    expect(await res.json()).toEqual({ name: 'Tutor', role: 'Teacher', systemPrompt: 'Teach.' });
  });

  it('returns 502 when Gemini throws, without leaking the error', async () => {
    const gemini = fakeGemini();
    gemini.runAgent = vi.fn(async () => {
      throw new Error('quota exceeded for key abc');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const call = await start(gemini);
    const res = await call('/api/run-agent', { systemPrompt: 'x', input: 'y' });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'The Gemini request failed.' });
  });
});

describe('Google tool routes', () => {
  it('require a Google session', async () => {
    const call = await start(fakeGemini());
    expect((await call('/api/drive/read', {})).status).toBe(401);
    expect((await call('/api/docs/write', { content: 'x' })).status).toBe(401);
    expect(await (await call('/api/auth/status')).json()).toEqual({ connected: false });
  });
});
