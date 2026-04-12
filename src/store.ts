import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  tools: string[];
}

export interface Workflow {
  id: string;
  name: string;
  task: string;
  memory: string;
  tools: string[];
  agentsPermitted: string[];
}

export interface ChatLog {
  step: string;
  output: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  logs?: ChatLog[];
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
}

interface AppState {
  agents: Agent[];
  workflows: Workflow[];
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  settings: {
    driveConnected: boolean;
    docsConnected: boolean;
  };
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, agent: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  addChatSession: (session: ChatSession) => void;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  updateMessageLogs: (sessionId: string, messageId: string, log: ChatLog) => void;
  updateMessageContent: (sessionId: string, messageId: string, content: string) => void;
  setCurrentSessionId: (id: string | null) => void;
  updateSettings: (settings: Partial<AppState["settings"]>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      agents: [
        {
          id: "agent-1",
          name: "Data Extractor",
          role: "Data Analyst",
          systemPrompt:
            "You are an expert data analyst. Extract key information from the provided text and format it clearly.",
          tools: ["readFromDrive"],
        },
        {
          id: "agent-2",
          name: "Content Writer",
          role: "Copywriter",
          systemPrompt:
            "You are a professional copywriter. Take the extracted data and write a compelling summary report.",
          tools: ["writeToDocs"],
        },
      ],
      workflows: [
        {
          id: "wf-1",
          name: "My Research Writer",
          task: "Extract data from Google Drive documents and draft a comprehensive research report in Google Docs.",
          memory: "Enabled (Vector DB Context)",
          tools: ["Google Drive", "Google Docs", "Web Search"],
          agentsPermitted: ["Data Extractor", "Content Writer"],
        },
      ],
      chatSessions: [],
      currentSessionId: null,
      settings: {
        driveConnected: false,
        docsConnected: false,
      },
      addAgent: (agent) =>
        set((state) => ({ agents: [...state.agents, agent] })),
      updateAgent: (id, updatedAgent) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, ...updatedAgent } : a,
          ),
        })),
      deleteAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
        })),
      addWorkflow: (workflow) =>
        set((state) => ({ workflows: [...state.workflows, workflow] })),
      updateWorkflow: (id, updatedWorkflow) =>
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, ...updatedWorkflow } : w,
          ),
        })),
      deleteWorkflow: (id) =>
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
        })),
      addChatSession: (session) => set((state) => ({ 
        chatSessions: [session, ...state.chatSessions],
        currentSessionId: session.id
      })),
      addMessageToSession: (sessionId, message) => set((state) => ({
        chatSessions: state.chatSessions.map(session => 
          session.id === sessionId 
            ? { ...session, messages: [...session.messages, message] }
            : session
        )
      })),
      updateMessageLogs: (sessionId, messageId, log) => set((state) => ({
        chatSessions: state.chatSessions.map(session => 
          session.id === sessionId 
            ? { 
                ...session, 
                messages: session.messages.map(msg => 
                  msg.id === messageId 
                    ? { ...msg, logs: [...(msg.logs || []), log] }
                    : msg
                )
              }
            : session
        )
      })),
      updateMessageContent: (sessionId, messageId, content) => set((state) => ({
        chatSessions: state.chatSessions.map(session => 
          session.id === sessionId 
            ? { 
                ...session, 
                messages: session.messages.map(msg => 
                  msg.id === messageId 
                    ? { ...msg, content }
                    : msg
                )
              }
            : session
        )
      })),
      setCurrentSessionId: (id) => set({ currentSessionId: id }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: "orchestrator-storage",
    },
  ),
);
