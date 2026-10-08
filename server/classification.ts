import { normalizeTools, type ToolName } from '../src/lib/tools';

export type Intent = 'chat' | 'workflow' | 'dynamic_task';

export interface DynamicAgent {
  name: string;
  role: string;
  systemPrompt: string;
  tools: ToolName[];
}

export interface Classification {
  intent: Intent;
  chatResponse?: string;
  workflowId?: string;
  dynamicTaskName?: string;
  dynamicAgents?: DynamicAgent[];
}

export const FALLBACK_CLASSIFICATION: Classification = {
  intent: 'chat',
  chatResponse: 'I am sorry, I could not process that.',
};

const INTENTS: Intent[] = ['chat', 'workflow', 'dynamic_task'];

const str = (value: unknown) => (typeof value === 'string' ? value : undefined);

/**
 * Turn the model's JSON text into a Classification the client can trust:
 * unknown intents fall back to chat, workflow IDs must exist, and dynamic
 * agents only keep tools the app implements.
 */
export function parseClassification(text: string | undefined, validWorkflowIds: string[] = []): Classification {
  if (!text) return FALLBACK_CLASSIFICATION;

  let raw: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return FALLBACK_CLASSIFICATION;
    raw = parsed;
  } catch {
    return FALLBACK_CLASSIFICATION;
  }

  const intent = INTENTS.includes(raw.intent as Intent) ? (raw.intent as Intent) : 'chat';

  if (intent === 'workflow') {
    const workflowId = str(raw.workflowId);
    if (workflowId && validWorkflowIds.includes(workflowId)) {
      return { intent, workflowId };
    }
    return { intent: 'chat', chatResponse: str(raw.chatResponse) || FALLBACK_CLASSIFICATION.chatResponse };
  }

  if (intent === 'dynamic_task') {
    const agents = Array.isArray(raw.dynamicAgents) ? raw.dynamicAgents : [];
    const dynamicAgents: DynamicAgent[] = agents
      .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
      .map((a, index) => ({
        name: str(a.name) || `Agent ${index + 1}`,
        role: str(a.role) || 'Assistant',
        systemPrompt: str(a.systemPrompt) || 'You are a helpful assistant.',
        tools: normalizeTools(a.tools),
      }));
    return { intent, dynamicTaskName: str(raw.dynamicTaskName) || 'Ad-hoc Task', dynamicAgents };
  }

  return { intent: 'chat', chatResponse: str(raw.chatResponse) || FALLBACK_CLASSIFICATION.chatResponse };
}
