import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import { createApp } from './server/app';
import { createGeminiService } from './server/gemini';

dotenv.config({ quiet: true });

const PORT = Number(process.env.PORT) || 3000;
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY is not set. The UI will load, but chat and agent generation will return errors.');
}

const app = createApp({
  gemini: apiKey ? createGeminiService(apiKey, process.env.GEMINI_MODEL || undefined) : null,
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Vite middleware for development (imported lazily so production doesn't load it).
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
