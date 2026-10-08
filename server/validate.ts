// Request body validation for the Gemini routes. Each validator returns either
// the cleaned value or an error message suitable for a 400 response.

export const MAX_TEXT = 50_000;

export type Result<T> = { value: T } | { error: string };

export interface WorkflowSummary {
  id: string;
  name: string;
  task: string;
}

export interface ClassifyRequest {
  input: string;
  workflows: WorkflowSummary[];
  chatHistory: string;
}

export interface GenerateAgentRequest {
  prompt: string;
}

export interface RunAgentRequest {
  systemPrompt: string;
  input: string;
  chatHistory: string;
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function text(body: Record<string, unknown>, key: string, required: boolean): Result<string> {
  const value = body[key];
  if (value === undefined && !required) return { value: '' };
  if (typeof value !== 'string') return { error: `${key} must be a string` };
  if (required && !value.trim()) return { error: `${key} is required` };
  if (value.length > MAX_TEXT) return { error: `${key} is too long` };
  return { value };
}

export function validateClassify(body: unknown): Result<ClassifyRequest> {
  if (!isObject(body)) return { error: 'body must be a JSON object' };
  const input = text(body, 'input', true);
  if ('error' in input) return input;
  const chatHistory = text(body, 'chatHistory', false);
  if ('error' in chatHistory) return chatHistory;

  const list = body.workflows ?? [];
  if (!Array.isArray(list)) return { error: 'workflows must be an array' };
  const workflows: WorkflowSummary[] = [];
  for (const w of list) {
    if (!isObject(w) || typeof w.id !== 'string' || typeof w.name !== 'string' || typeof w.task !== 'string') {
      return { error: 'each workflow needs string id, name and task' };
    }
    workflows.push({ id: w.id, name: w.name, task: w.task });
  }
  return { value: { input: input.value, workflows, chatHistory: chatHistory.value } };
}

export function validateGenerateAgent(body: unknown): Result<GenerateAgentRequest> {
  if (!isObject(body)) return { error: 'body must be a JSON object' };
  const prompt = text(body, 'prompt', true);
  if ('error' in prompt) return prompt;
  return { value: { prompt: prompt.value } };
}

export function validateRunAgent(body: unknown): Result<RunAgentRequest> {
  if (!isObject(body)) return { error: 'body must be a JSON object' };
  const systemPrompt = text(body, 'systemPrompt', true);
  if ('error' in systemPrompt) return systemPrompt;
  const input = text(body, 'input', true);
  if ('error' in input) return input;
  const chatHistory = text(body, 'chatHistory', false);
  if ('error' in chatHistory) return chatHistory;
  return { value: { systemPrompt: systemPrompt.value, input: input.value, chatHistory: chatHistory.value } };
}
