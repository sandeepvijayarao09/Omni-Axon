# Omni-Axon

> A modular AI workflow orchestrator that routes tasks across configurable specialist agents, powered by Google Gemini.

Built for the Stanford x DeepMind Hackathon.

## Overview

Omni-Axon (in-app: **Omni Axiom**) is a single-page web app for building and running multi-agent AI workflows. A "master agent" classifies each user request and either answers directly, runs a predefined workflow, or dynamically assembles a temporary team of sub-agents to solve the task. Permitted agents run as a sequential pipeline, with each agent's output feeding the next. Agents can use tools such as reading from Google Drive and writing results to Google Docs via authenticated Google Workspace APIs.

## Features

- **Chat with a master orchestrator** that classifies intent as a direct answer, a matched workflow, or a dynamically generated multi-agent task
- **Agent Builder** — create, edit, and delete agents, including AI-assisted generation of an agent's name, role, and system prompt
- **Workflows** — define reusable pipelines that specify the task, memory mode, tools, and which agents are permitted
- **Sequential execution** — permitted agents run in order, passing context forward, with live step-by-step progress logs
- **Tool integrations** — read recent files from Google Drive and create Google Docs from agent output via OAuth
- **Executions & Chat History** — review past runs and conversations
- **Settings** — manage user profile and Google Drive/Docs connection state
- Client-side state persisted in the browser via Zustand (ships with example agents and workflows out of the box)

## Tech Stack

- **Frontend:** React 19, React Router, Vite, Tailwind CSS v4, shadcn-style UI components (Base UI / Radix), Lucide icons, Motion, `@xyflow/react`, Zustand
- **Backend:** Express server (`server.ts`) run via `tsx`, with `express-session` and `cookie-parser`
- **AI:** Google Gemini via `@google/genai`
- **Integrations:** Google Workspace (Drive + Docs) through `googleapis` OAuth2
- **Language/Tooling:** TypeScript

## Prerequisites

- Node.js
- A Google Gemini API key
- (Optional, for Drive/Docs tools) Google OAuth credentials from the Google Cloud Console

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file based on [`.env.example`](.env.example) and fill in the values:

   ```
   GEMINI_API_KEY="your-gemini-api-key"
   APP_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID=""        # required only for Drive/Docs integration
   GOOGLE_CLIENT_SECRET=""    # required only for Drive/Docs integration
   SESSION_SECRET="a-random-secret"
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

   The Express server (with Vite middleware) starts on http://localhost:3000.

## Available Scripts

- `npm run dev` — start the Express + Vite dev server (`tsx server.ts`)
- `npm run build` — build the frontend with Vite
- `npm run preview` — preview the production build
- `npm run start` — run the server in production mode
- `npm run lint` — type-check with `tsc --noEmit`
- `npm run clean` — remove the `dist` directory

## How It Works

1. **Classification** — user input is sent to Gemini, which returns an intent: `chat` (direct reply), `workflow` (run an existing pipeline), or `dynamic_task` (generate temporary agents to solve it).
2. **Execution** — for a workflow, the permitted agents run sequentially; each agent's response becomes the input/context for the next.
3. **Tools** — if an agent is granted "Google Drive" it fetches recent files via `/api/drive/read`; if granted "Google Docs" it writes its output to a new doc via `/api/docs/write`. These call the Google APIs using OAuth tokens stored in an HTTP-only cookie.

## Project Structure

```
server.ts              -- Express server: Vite middleware + Google OAuth, Drive, and Docs endpoints
index.html             -- App entry HTML
src/
  main.tsx             -- React entry point
  App.tsx              -- Router and routes
  store.ts             -- Zustand store (agents, workflows, sessions, executions, settings)
  lib/gemini.ts        -- Gemini calls: classify, generate agent, execute workflow
  components/          -- Layout and shadcn-style UI components
  pages/               -- Chat, ChatHistory, Workflows, AgentBuilder, Executions, Settings
vite.config.ts         -- Vite configuration
.env.example           -- Environment variable template
```

## Notes

- This project originated as a Google AI Studio app.
- Do not commit real secrets; use the `.env` file (gitignored) for API keys and OAuth credentials.

## License

Licensed under the terms in [LICENSE](LICENSE).
