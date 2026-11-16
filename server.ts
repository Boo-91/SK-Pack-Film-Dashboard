import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  AuthHttpError,
  fetchPublicGoogleSheet,
  hasServiceAccountCredentials,
  verifyCompanyFirebaseToken,
} from './src/lib/sheetServer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.get('/api/sheet', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    const checkOnly = req.query.check === '1';
    const defaultEnvUrl = process.env.GOOGLE_SHEET_URL || '';

    if (checkOnly) {
      res.status(200).json({
        hasDefaultEnvSheet: Boolean(defaultEnvUrl.trim()),
        hasServiceAccount: hasServiceAccountCredentials(),
      });
      return;
    }

    try {
      await verifyCompanyFirebaseToken(req.headers.authorization);
    } catch (err) {
      const status = err instanceof AuthHttpError ? err.status : 401;
      const message =
        err instanceof Error ? err.message : 'Unauthorized request.';
      res.status(status).json({ error: message });
      return;
    }

    const requestedUrl =
      typeof req.query.url === 'string' ? req.query.url.trim() : '';
    const sheetName =
      typeof req.query.sheet === 'string' ? req.query.sheet.trim() : '';
    const gid = typeof req.query.gid === 'string' ? req.query.gid.trim() : '';

    const targetUrl = requestedUrl || defaultEnvUrl.trim();
    if (!targetUrl) {
      res.status(400).json({
        error:
          'No Google Sheet URL provided. Paste a sheet link or set GOOGLE_SHEET_URL in environment variables.',
      });
      return;
    }

    try {
      const result = await fetchPublicGoogleSheet({
        urlOrId: targetUrl,
        sheetName: sheetName || undefined,
        gid: gid || undefined,
      });
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({
        error:
          err instanceof Error ? err.message : 'Failed to fetch Google Sheet.',
      });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
