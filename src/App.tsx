/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Chat } from "./pages/Chat";
import { ChatHistory } from "./pages/ChatHistory";
import { Workflows } from "./pages/Workflows";
import { AgentBuilder } from "./pages/AgentBuilder";
import { Settings } from "./pages/Settings";
import { Executions } from "./pages/Executions";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Chat />} />
          <Route path="history" element={<ChatHistory />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="agents" element={<AgentBuilder />} />
          <Route path="executions" element={<Executions />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
