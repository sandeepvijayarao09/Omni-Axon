import { GoogleGenAI, Type } from '@google/genai';
import { Agent, Workflow } from '@/store';

// Initialize the Gemini client using the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function classifyAndRespond(input: string, workflows: Workflow[], chatHistory: string = "") {
  const workflowDescriptions = workflows.map(w => `- ID: ${w.id} | Name: ${w.name} | Task: ${w.task}`).join('\n');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Chat History Context:\n${chatHistory}\n\nUser input: "${input}"\n\nAvailable workflows:\n${workflowDescriptions}`,
      config: {
        systemInstruction: `You are the Master Agent Orchestrator. 
Determine how to handle the user's input.
1. If the input clearly matches the task description of an available workflow, set intent to 'workflow' and provide the workflowId.
2. If the input is a complex task or multi-step process that DOES NOT match any available workflow, set intent to 'dynamic_task'. You must generate a temporary workflow name and a list of temporary sub-agents (with name, role, systemPrompt, and tools) to solve this task. Available tools you can assign: ["Google Drive", "Google Docs", "Web Search", "Google Sheets", "Gmail"].
3. If the input is a general question, conversational query, or simple request for information that you can answer directly in one step, set intent to 'chat' and provide a helpful, direct response to the user's input using your own knowledge.`,
        responseMimeType: "application/json",
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
                    items: { type: Type.STRING },
                    description: "Tools required by this agent (e.g. 'Google Docs', 'Google Drive')"
                  }
                }
              },
              description: "List of temporary agents to solve the task if intent is 'dynamic_task'"
            }
          },
          required: ["intent"]
        }
      }
    });
    
    return JSON.parse(response.text || '{"intent": "chat", "chatResponse": "I am sorry, I could not process that."}');
  } catch (error) {
    console.error("Classification error:", error);
    return { intent: "chat", chatResponse: "I encountered an error trying to process your request." };
  }
}

export async function generateAgent(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate an AI agent profile based on this request: "${prompt}"`,
      config: {
        systemInstruction: `You are an expert AI architect. Generate a JSON object for an AI agent with the following fields:
- name: A short, professional name for the agent (e.g., "Data Analyst").
- role: A descriptive role (e.g., "Senior Data Scientist").
- systemPrompt: A detailed system prompt instructing the agent on how to behave, what their expertise is, and how they should format their output.
Return ONLY valid JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            role: { type: Type.STRING },
            systemPrompt: { type: Type.STRING }
          },
          required: ["name", "role", "systemPrompt"]
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Agent generation error:", error);
    throw error;
  }
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
      if (agent.tools.includes("Google Drive") || agent.tools.includes("Read from Google Drive")) {
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

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Chat History Context:\n${chatHistory}\n\nProcess the following input based on your instructions:\n\n${currentContext}${toolContext}`,
        config: {
          systemInstruction: `${agent.systemPrompt}\n\nYou are acting as a node in an automated pipeline. Output only the processed result, no conversational filler.`,
          temperature: 0.2,
        }
      });

      currentContext = response.text || 'No output generated.';
      onProgress(`Agent Completed: ${agent.name}`, currentContext);

      // Handle Google Docs Tool
      if (agent.tools.includes("Google Docs") || agent.tools.includes("Write to Google Docs")) {
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
