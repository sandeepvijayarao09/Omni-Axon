import { GoogleGenAI, Type } from '@google/genai';
import { IMPLEMENTED_TOOLS } from '../src/lib/tools';
import { parseClassification, type Classification } from './classification';
import type { ClassifyRequest, RunAgentRequest } from './validate';

export interface GeneratedAgent {
  name: string;
  role: string;
  systemPrompt: string;
}

/** Everything the HTTP layer needs from Gemini. Tests swap in a fake. */
export interface GeminiService {
  classify(req: ClassifyRequest): Promise<Classification>;
  generateAgent(prompt: string): Promise<GeneratedAgent>;
  runAgent(req: RunAgentRequest): Promise<string>;
}

export function createGeminiService(apiKey: string, model = 'gemini-3-flash-preview'): GeminiService {
  const ai = new GoogleGenAI({ apiKey });

  return {
    async classify({ input, workflows, chatHistory }) {
      const workflowDescriptions = workflows.map(w => `- ID: ${w.id} | Name: ${w.name} | Task: ${w.task}`).join('\n');
      const response = await ai.models.generateContent({
        model,
        contents: `Chat History Context:\n${chatHistory}\n\nUser input: "${input}"\n\nAvailable workflows:\n${workflowDescriptions}`,
        config: {
          systemInstruction: `You are the Master Agent Orchestrator.
Determine how to handle the user's input.
1. If the input clearly matches the task description of an available workflow, set intent to 'workflow' and provide the workflowId.
2. If the input is a complex task or multi-step process that DOES NOT match any available workflow, set intent to 'dynamic_task'. You must generate a temporary workflow name and a list of temporary sub-agents (with name, role, systemPrompt, and tools) to solve this task. The only tools you can assign are: ${JSON.stringify(IMPLEMENTED_TOOLS)}. Assign none if the task does not need them.
3. If the input is a general question, conversational query, or simple request for information that you can answer directly in one step, set intent to 'chat' and provide a helpful, direct response to the user's input using your own knowledge.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING, description: "'chat', 'workflow', or 'dynamic_task'" },
              chatResponse: { type: Type.STRING, description: "The direct response if intent is 'chat'" },
              workflowId: { type: Type.STRING, description: "The ID of the workflow if intent is 'workflow'" },
              dynamicTaskName: { type: Type.STRING, description: "Name of the dynamic task if intent is 'dynamic_task'" },
              dynamicAgents: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    systemPrompt: { type: Type.STRING },
                    tools: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING, enum: [...IMPLEMENTED_TOOLS] },
                      description: 'Tools required by this agent',
                    },
                  },
                },
                description: "List of temporary agents to solve the task if intent is 'dynamic_task'",
              },
            },
            required: ['intent'],
          },
        },
      });
      return parseClassification(response.text, workflows.map(w => w.id));
    },

    async generateAgent(prompt) {
      const response = await ai.models.generateContent({
        model,
        contents: `Generate an AI agent profile based on this request: "${prompt}"`,
        config: {
          systemInstruction: `You are an expert AI architect. Generate a JSON object for an AI agent with the following fields:
- name: A short, professional name for the agent (e.g., "Data Analyst").
- role: A descriptive role (e.g., "Senior Data Scientist").
- systemPrompt: A detailed system prompt instructing the agent on how to behave, what their expertise is, and how they should format their output.
Return ONLY valid JSON.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              systemPrompt: { type: Type.STRING },
            },
            required: ['name', 'role', 'systemPrompt'],
          },
        },
      });
      const parsed = JSON.parse(response.text || '{}');
      return {
        name: String(parsed.name ?? ''),
        role: String(parsed.role ?? ''),
        systemPrompt: String(parsed.systemPrompt ?? ''),
      };
    },

    async runAgent({ systemPrompt, input, chatHistory }) {
      const response = await ai.models.generateContent({
        model,
        contents: `Chat History Context:\n${chatHistory}\n\nProcess the following input based on your instructions:\n\n${input}`,
        config: {
          systemInstruction: `${systemPrompt}\n\nYou are acting as a node in an automated pipeline. Output only the processed result, no conversational filler.`,
          temperature: 0.2,
        },
      });
      return response.text || 'No output generated.';
    },
  };
}
