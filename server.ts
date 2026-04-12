import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
  }
}));

// OAuth2 Client setup
const getOAuth2Client = (redirectUri: string) => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

const getRedirectUri = (req: express.Request) => {
  if (process.env.APP_URL) {
    return `${process.env.APP_URL}/api/auth/callback`;
  }
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}/api/auth/callback`;
};

app.get("/api/auth/url", (req, res) => {
  const redirectUri = getRedirectUri(req);
  const oauth2Client = getOAuth2Client(redirectUri);

  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/documents'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.json({ url });
});

app.get("/api/auth/callback", async (req, res) => {
  const { code } = req.query;
  const redirectUri = getRedirectUri(req);
  
  try {
    const oauth2Client = getOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Store tokens in cookie
    res.cookie('google_tokens', JSON.stringify(tokens), {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
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

app.get("/api/auth/status", (req, res) => {
  const tokens = req.cookies.google_tokens;
  res.json({ connected: !!tokens });
});

app.post("/api/auth/disconnect", (req, res) => {
  res.clearCookie('google_tokens', {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
  });
  res.json({ success: true });
});

// Drive and Docs API endpoints
app.post("/api/drive/read", async (req, res) => {
  const tokensStr = req.cookies.google_tokens;
  if (!tokensStr) return res.status(401).json({ error: "Not authenticated" });
  
  const tokens = JSON.parse(tokensStr);
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);
  
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    const { fileId } = req.body;
    
    if (fileId) {
      const response = await drive.files.export({
        fileId: fileId,
        mimeType: 'text/plain'
      });
      return res.json({ content: response.data });
    } else {
      const response = await drive.files.list({
        pageSize: 5,
        fields: 'nextPageToken, files(id, name, mimeType)',
      });
      return res.json({ files: response.data.files });
    }
  } catch (error) {
    console.error('Drive API error:', error);
    res.status(500).json({ error: "Failed to read from Drive" });
  }
});

app.post("/api/docs/write", async (req, res) => {
  const tokensStr = req.cookies.google_tokens;
  if (!tokensStr) return res.status(401).json({ error: "Not authenticated" });
  
  const tokens = JSON.parse(tokensStr);
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);
  
  const docs = google.docs({ version: 'v1', auth: oauth2Client });
  
  try {
    const { title, content } = req.body;
    
    // Create a new document
    const createResponse = await docs.documents.create({
      requestBody: {
        title: title || 'Generated Document'
      }
    });
    
    const documentId = createResponse.data.documentId;
    
    if (content && documentId) {
      await docs.documents.batchUpdate({
        documentId: documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content
              }
            }
          ]
        }
      });
    }
    
    res.json({ documentId, url: `https://docs.google.com/document/d/${documentId}/edit` });
  } catch (error) {
    console.error('Docs API error:', error);
    res.status(500).json({ error: "Failed to write to Docs" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
