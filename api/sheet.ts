import {
  fetchPublicGoogleSheet,
  hasServiceAccountCredentials,
} from '../src/lib/sheetServer';

interface VercelReq {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}

interface VercelRes {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: unknown) => void;
  };
}

function getParam(
  query: Record<string, string | string[] | undefined> | undefined,
  key: string
): string {
  const val = query?.[key];
  if (Array.isArray(val)) return val[0] ?? '';
  return val ?? '';
}

export default async function handler(req: VercelReq, res: VercelRes) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checkOnly = getParam(req.query, 'check') === '1';
  const defaultEnvUrl = process.env.GOOGLE_SHEET_URL || '';

  if (checkOnly) {
    return res.status(200).json({
      hasDefaultEnvSheet: Boolean(defaultEnvUrl.trim()),
      hasServiceAccount: hasServiceAccountCredentials(),
    });
  }

  const requestedUrl = getParam(req.query, 'url').trim();
  const sheetName = getParam(req.query, 'sheet').trim();
  const gid = getParam(req.query, 'gid').trim();

  const targetUrl = requestedUrl || defaultEnvUrl.trim();
  if (!targetUrl) {
    return res.status(400).json({
      error: 'No Google Sheet URL provided. Paste a sheet link or set GOOGLE_SHEET_URL in Vercel.',
    });
  }

  try {
    const result = await fetchPublicGoogleSheet({
      urlOrId: targetUrl,
      sheetName: sheetName || undefined,
      gid: gid || undefined,
    });
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch Google Sheet.';
    return res.status(400).json({ error: message });
  }
}
