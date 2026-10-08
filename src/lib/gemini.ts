import { Agent, Workflow } from '@/store';
import { hasTool } from '@/lib/tools';

// All Gemini calls go through the Express server (server/app.ts), which holds
// the API key. Nothing in this file talks to Google directly.

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request to ${url} failed (${res.status})`);
  }
  return data as T;
}

export interface ClassificationResult {
  intent: 'chat' | 'workflow' | 'dynamic_task';
  chatResponse?: string;
  workflowId?: string;
  dynamicTaskName?: string;
  dynamicAgents?: { name: string; role: string; systemPrompt: string; tools: string[] }[];
}

export async function classifyAndRespond(input: string, workflows: Workflow[], chatHistory: string = ""): Promise<ClassificationResult> {
  try {
    return await postJSON<ClassificationResult>('/api/classify', {
      input,
      chatHistory,
      workflows: workflows.map(w => ({ id: w.id, name: w.name, task: w.task })),
    });
  } catch (error) {
    console.error("Classification error:", error);
    const reason = error instanceof Error ? error.message : 'Unknown error';
    return { intent: "chat", chatResponse: `I encountered an error trying to process your request: ${reason}` };
  }
}

export async function generateAgent(prompt: string) {
  return postJSON<{ name: string; role: string; systemPrompt: string }>('/api/generate-agent', { prompt });
}

export async function executeWorkflow(
  workflow: Workflow,
  agents: Agent[],
  initialInput: string,
  onProgress: (step: string, output: string) => void,
  chatHistory: string = ""
) {
  try {
    let currentContext = initialInput;
    
    // Filter agents permitted in this workflow
    const permittedAgents = agents.filter(a => workflow.agentsPermitted.includes(a.name));
    
    if (permittedAgents.length === 0) {
      onProgress('Error', 'No permitted agents found for this workflow.');
      return 'Execution failed: No agents available.';
    }

    onProgress('Master Agent', `Routing task to workflow: ${workflow.name}`);

    for (const agent of permittedAgents) {
      onProgress(`Agent Running: ${agent.name}`, `Processing data with role: ${agent.role}...`);
      
      let toolContext = "";

      // Handle Google Drive Tool
      if (hasTool(agent.tools, "Google Drive")) {
        onProgress(`Tool Execution`, `Fetching recent files from Google Drive...`);
        try {
          const res = await fetch('/api/drive/read', { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            if (data.files) {
              const fileList = data.files.map((f: any) => `- ${f.name} (ID: ${f.id})`).join('\n');
              toolContext += `\n\n[Google Drive Context - Recent Files]\n${fileList}`;
              onProgress(`Tool Success`, `Retrieved ${data.files.length} files from Drive.`);
            }
          } else {
            onProgress(`Tool Warning`, `Google Drive not connected or unauthorized.`);
          }
        } catch (e) {
          onProgress(`Tool Error`, `Failed to read from Google Drive.`);
        }
      }

      const { output } = await postJSON<{ output: string }>('/api/run-agent', {
        systemPrompt: agent.systemPrompt,
        input: `${currentContext}${toolContext}`,
        chatHistory,
      });

      currentContext = output || 'No output generated.';
      onProgress(`Agent Completed: ${agent.name}`, currentContext);

      // Handle Google Docs Tool
      if (hasTool(agent.tools, "Google Docs")) {
        onProgress(`Tool Execution`, `Writing output to Google Docs...`);
        try {
          const res = await fetch('/api/docs/write', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `Agent Output: ${agent.name} - ${new Date().toLocaleDateString()}`,
              content: currentContext
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              onProgress(`Tool Success`, `Document created successfully: ${data.url}`);
              currentContext += `\n\n[Document Link: ${data.url}]`;
            }
          } else {
            onProgress(`Tool Warning`, `Google Docs not connected or unauthorized.`);
          }
        } catch (e) {
          onProgress(`Tool Error`, `Failed to write to Google Docs.`);
        }
      }
    }

    onProgress('Master Agent', `Workflow "${workflow.name}" completed successfully.`);
    return currentContext;
  } catch (error) {
    console.error('Workflow execution failed:', error);
    onProgress('Execution Failed', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}
