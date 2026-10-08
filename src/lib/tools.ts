// Tools an agent can actually use. Each one is backed by a server route:
//   Google Drive -> POST /api/drive/read  (lists recent files)
//   Google Docs  -> POST /api/docs/write  (creates a doc from the agent's output)
export const IMPLEMENTED_TOOLS = ['Google Drive', 'Google Docs'] as const;

export type ToolName = (typeof IMPLEMENTED_TOOLS)[number];

// Labels used by earlier versions of the UI that map onto a real tool.
const TOOL_ALIASES: Record<string, ToolName> = {
  'google drive': 'Google Drive',
  'read from google drive': 'Google Drive',
  'google docs': 'Google Docs',
  'write to google docs': 'Google Docs',
};

/** Keep only implemented tools, mapping legacy labels and dropping duplicates. */
export function normalizeTools(tools: unknown): ToolName[] {
  if (!Array.isArray(tools)) return [];
  const result: ToolName[] = [];
  for (const tool of tools) {
    if (typeof tool !== 'string') continue;
    const name = TOOL_ALIASES[tool.trim().toLowerCase()];
    if (name && !result.includes(name)) result.push(name);
  }
  return result;
}

export function hasTool(tools: unknown, tool: ToolName): boolean {
  return normalizeTools(tools).includes(tool);
}
