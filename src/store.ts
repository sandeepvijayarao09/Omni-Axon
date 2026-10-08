import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeTools } from "@/lib/tools";

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

export interface ExecutionLog {
  step: string;
  output: string;
  timestamp: string;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  logs: ExecutionLog[];
  triggerInput: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  logs?: ChatLog[];
  attachments?: { name: string; type: string; data: string }[];
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  company: string;
}

interface AppState {
  agents: Agent[];
  workflows: Workflow[];
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  executions: Execution[];
  userProfile: UserProfile;
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
  addExecution: (execution: Execution) => void;
  updateExecution: (id: string, updates: Partial<Execution>) => void;
  addExecutionLog: (id: string, log: ExecutionLog) => void;
  updateSettings: (settings: Partial<AppState["settings"]>) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
}

/**
 * Version 0 of the persisted state could hold tools that were never
 * implemented (Web Search, Gmail, Jira, ...). Strip them so the UI only
 * shows tools that actually run.
 */
export function migratePersistedState(persisted: unknown, version: number): unknown {
  if (!persisted || typeof persisted !== "object") return persisted;
  if (version >= 1) return persisted;
  const state = persisted as Partial<AppState>;
  return {
    ...state,
    agents: state.agents?.map((a) => ({ ...a, tools: normalizeTools(a.tools) })),
    workflows: state.workflows?.map((w) => ({ ...w, tools: normalizeTools(w.tools) })),
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      agents: [
        {
          id: "agent-1",
          name: "Researcher",
          role: "Research Specialist",
          systemPrompt: "You are an expert researcher. Gather comprehensive and accurate information from the input and any Google Drive context you are given.",
          tools: ["Google Drive"],
        },
        {
          id: "agent-2",
          name: "Content Writer",
          role: "Copywriter",
          systemPrompt: "You are a professional copywriter. Take extracted data and write compelling, well-structured content.",
          tools: ["Google Docs"],
        },
        {
          id: "agent-3",
          name: "Data Analyst",
          role: "Data Scientist",
          systemPrompt: "You are a data analyst. Extract key metrics, identify trends, and format data clearly.",
          tools: ["Google Drive"],
        },
        {
          id: "agent-4",
          name: "SEO Specialist",
          role: "SEO Expert",
          systemPrompt: "You are an SEO expert. Optimize content for search engines and identify high-value keywords.",
          tools: [],
        },
        {
          id: "agent-5",
          name: "Code Reviewer",
          role: "Senior Software Engineer",
          systemPrompt: "You are a senior engineer. Review code for bugs, performance issues, and best practices.",
          tools: [],
        },
        {
          id: "agent-6",
          name: "Email Marketer",
          role: "Marketing Specialist",
          systemPrompt: "You are an email marketing expert. Draft high-converting email campaigns and newsletters.",
          tools: [],
        },
        {
          id: "agent-7",
          name: "Social Media Manager",
          role: "Social Media Expert",
          systemPrompt: "You are a social media manager. Create engaging posts tailored for Twitter, LinkedIn, and Instagram.",
          tools: [],
        },
        {
          id: "agent-8",
          name: "Customer Support",
          role: "Support Agent",
          systemPrompt: "You are a polite and helpful customer support agent. Resolve user queries efficiently.",
          tools: [],
        },
        {
          id: "agent-9",
          name: "Project Manager",
          role: "Agile Scrum Master",
          systemPrompt: "You are a project manager. Break work down into clear, well-scoped tickets with owners and acceptance criteria.",
          tools: [],
        },
        {
          id: "agent-10",
          name: "Financial Modeler",
          role: "Financial Analyst",
          systemPrompt: "You are a financial analyst. Create revenue projections and analyze financial statements.",
          tools: ["Google Drive"],
        }
      ],
      workflows: [
        {
          id: "wf-1",
          name: "My Research Writer",
          task: "Extract data from Google Drive documents and draft a comprehensive research report in Google Docs.",
          memory: "Recent chat history",
          tools: ["Google Drive", "Google Docs"],
          agentsPermitted: ["Researcher", "Content Writer"],
        },
        {
          id: "wf-2",
          name: "Weekly Analytics Report",
          task: "Analyze the metrics provided in the chat, identify trends, and draft an email summary for stakeholders.",
          memory: "Recent chat history",
          tools: ["Google Drive"],
          agentsPermitted: ["Data Analyst", "Email Marketer"],
        },
        {
          id: "wf-3",
          name: "Social Media Campaign Launch",
          task: "Suggest high-value keywords for a topic and draft a week-long social media content calendar.",
          memory: "Recent chat history",
          tools: [],
          agentsPermitted: ["SEO Specialist", "Social Media Manager"],
        },
        {
          id: "wf-4",
          name: "Code Audit & Ticketing",
          task: "Review code pasted into the chat and draft tickets for the technical debt it contains.",
          memory: "Recent chat history",
          tools: [],
          agentsPermitted: ["Code Reviewer", "Project Manager"],
        }
      ],
      chatSessions: [],
      currentSessionId: null,
      executions: [],
      userProfile: {
        name: "Admin User",
        email: "admin@example.com",
        role: "System Administrator",
        company: "Example Corp",
      },
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
      addExecution: (execution) => set((state) => ({ executions: [execution, ...state.executions] })),
      updateExecution: (id, updates) => set((state) => ({
        executions: state.executions.map(e => e.id === id ? { ...e, ...updates } : e)
      })),
      addExecutionLog: (id, log) => set((state) => ({
        executions: state.executions.map(e => 
          e.id === id ? { ...e, logs: [...e.logs, log] } : e
        )
      })),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      updateUserProfile: (profile) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...profile },
        })),
    }),
    {
      name: "omniaxiom-storage-v1",
      version: 1,
      migrate: (persisted, version) => migratePersistedState(persisted, version) as AppState,
    },
  ),
);
