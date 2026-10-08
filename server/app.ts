import express from 'express';
import cookieParser from 'cookie-parser';
import { google } from 'googleapis';
import type { GeminiService } from './gemini';
import { validateClassify, validateGenerateAgent, validateRunAgent, type Result } from './validate';

export interface AppOptions {
  /** null when GEMINI_API_KEY is not set; the AI routes then answer 503. */
  gemini: GeminiService | null;
}

const TOKEN_COOKIE = 'google_tokens';
const cookieOptions = { secure: true, sameSite: 'none' as const, httpOnly: true };

const getOAuth2Client = (redirectUri?: string) =>
  new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUri);

const getRedirectUri = (req: express.Request) => {
  if (process.env.APP_URL) {
    return `${process.env.APP_URL}/api/auth/callback`;
  }
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  return `${protocol}://${host}/api/auth/callback`;
};

/** OAuth client for the signed-in user, or null if the token cookie is missing or unreadable. */
function userAuth(req: express.Request) {
  const raw = req.cookies?.[TOKEN_COOKIE];
  if (!raw) return null;
  try {
    const client = getOAuth2Client();
    client.setCredentials(JSON.parse(raw));
    return client;
  } catch {
    return null;
  }
}

export function createApp({ gemini }: AppOptions) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({
      gemini: !!gemini,
      googleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    });
  });

  // --- Gemini routes. The API key never leaves the server. ---

  function aiRoute<T>(validate: (body: unknown) => Result<T>, handler: (service: GeminiService, value: T) => Promise<unknown>) {
    return async (req: express.Request, res: express.Response) => {
      const parsed = validate(req.body);
      if ('error' in parsed) return res.status(400).json({ error: parsed.error });
      if (!gemini) {
        return res.status(503).json({ error: 'GEMINI_API_KEY is not set on the server. Add it to .env and restart.' });
      }
      try {
        res.json(await handler(gemini, parsed.value));
      } catch (error) {
        console.error(`${req.path} failed:`, error);
        res.status(502).json({ error: 'The Gemini request failed.' });
      }
    };
  }

  app.post('/api/classify', aiRoute(validateClassify, (g, v) => g.classify(v)));
  app.post('/api/generate-agent', aiRoute(validateGenerateAgent, (g, v) => g.generateAgent(v.prompt)));
  app.post('/api/run-agent', aiRoute(validateRunAgent, async (g, v) => ({ output: await g.runAgent(v) })));

  // --- Google OAuth ---

  app.get('/api/auth/url', (req, res) => {
    const oauth2Client = getOAuth2Client(getRedirectUri(req));
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/documents'],
      prompt: 'consent',
    });
    res.json({ url });
  });

  app.get('/api/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (typeof code !== 'string') return res.status(400).send('Missing authorization code');
    try {
      const oauth2Client = getOAuth2Client(getRedirectUri(req));
      const { tokens } = await oauth2Client.getToken(code);
      res.cookie(TOKEN_COOKIE, JSON.stringify(tokens), {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, window.location.origin);
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
    } catch (error) {
      console.error('Error retrieving access token', error);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/auth/status', (req, res) => {
    res.json({ connected: !!req.cookies?.[TOKEN_COOKIE] });
  });

  app.post('/api/auth/disconnect', (_req, res) => {
    res.clearCookie(TOKEN_COOKIE, cookieOptions);
    res.json({ success: true });
  });

  // --- Tools: Google Drive (read) and Google Docs (write) ---

  app.post('/api/drive/read', async (req, res) => {
    const auth = userAuth(req);
    if (!auth) return res.status(401).json({ error: 'Not authenticated' });
    const drive = google.drive({ version: 'v3', auth });
    try {
      const fileId = req.body?.fileId;
      if (typeof fileId === 'string' && fileId) {
        const response = await drive.files.export({ fileId, mimeType: 'text/plain' });
        return res.json({ content: response.data });
      }
      const response = await drive.files.list({
        pageSize: 5,
        fields: 'nextPageToken, files(id, name, mimeType)',
      });
      return res.json({ files: response.data.files });
    } catch (error) {
      console.error('Drive API error:', error);
      res.status(500).json({ error: 'Failed to read from Drive' });
    }
  });

  app.post('/api/docs/write', async (req, res) => {
    const auth = userAuth(req);
    if (!auth) return res.status(401).json({ error: 'Not authenticated' });
    const docs = google.docs({ version: 'v1', auth });
    try {
      const { title, content } = req.body ?? {};
      const createResponse = await docs.documents.create({
        requestBody: { title: typeof title === 'string' && title ? title : 'Generated Document' },
      });
      const documentId = createResponse.data.documentId;
      if (typeof content === 'string' && content && documentId) {
        await docs.documents.batchUpdate({
          documentId,
          requestBody: { requests: [{ insertText: { location: { index: 1 }, text: content } }] },
        });
      }
      res.json({ documentId, url: `https://docs.google.com/document/d/${documentId}/edit` });
    } catch (error) {
      console.error('Docs API error:', error);
      res.status(500).json({ error: 'Failed to write to Docs' });
    }
  });

  return app;
}
