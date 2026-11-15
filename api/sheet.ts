import crypto from 'node:crypto';

interface VercelReq {
  method?: string;
  url?: string;
  query?: Record<string, string | string[] | undefined>;
}

interface VercelRes {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: unknown) => void;
  };
}

interface ServiceAccountCreds {
  clientEmail: string;
  privateKey: string;
}

interface SheetFetchResult {
  spreadsheetId: string;
  gid: string | null;
  rows: string[][];
  fetchedAt: string;
  authMode: 'service-account' | 'public-csv';
}

let cachedToken: { token: string; expiresAt: number; email: string } | null =
  null;

function getParam(req: VercelReq, key: string): string {
  const fromQuery = req.query?.[key];
  if (Array.isArray(fromQuery)) return fromQuery[0] ?? '';
  if (typeof fromQuery === 'string') return fromQuery;

  if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      return parsed.searchParams.get(key) ?? '';
    } catch {
      return '';
    }
  }
  return '';
}

function extractGoogleSheetInfo(input: string): {
  spreadsheetId: string | null;
  gid: string | null;
  publishedUrl: string | null;
} {
  const trimmed = input.trim();
  if (!trimmed) return { spreadsheetId: null, gid: null, publishedUrl: null };

  const gidMatch = trimmed.match(/[?#&]gid=([0-9]+)/);

  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch) {
    const base = `https://docs.google.com/spreadsheets/d/e/${pubMatch[1]}/pub`;
    const params = new URLSearchParams({ output: 'csv' });
    if (gidMatch?.[1]) {
      params.set('gid', gidMatch[1]);
      params.set('single', 'true');
    }
    return {
      spreadsheetId: pubMatch[1],
      gid: gidMatch ? gidMatch[1] : null,
      publishedUrl: `${base}?${params.toString()}`,
    };
  }

  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return { spreadsheetId: trimmed, gid: null, publishedUrl: null };
  }

  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return {
    spreadsheetId: idMatch ? idMatch[1] : null,
    gid: gidMatch ? gidMatch[1] : null,
    publishedUrl: null,
  };
}

function parseCsvText(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  const text = csvText.replace(/^\uFEFF/, '');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((cell) => cell !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseServiceAccountFromEnv(): ServiceAccountCreds | null {
  const rawJson = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim();
  if (rawJson) {
    const jsonStr = rawJson.startsWith('{')
      ? rawJson
      : Buffer.from(rawJson, 'base64').toString('utf8');
    try {
      const parsed = JSON.parse(jsonStr) as {
        client_email?: string;
        private_key?: string;
      };
      if (parsed.client_email && parsed.private_key) {
        return {
          clientEmail: parsed.client_email.trim(),
          privateKey: parsed.private_key.replace(/\\n/g, '\n'),
        };
      }
    } catch {
      // Fallback extraction in case pasted JSON contains raw newlines inside private_key
      const emailMatch = jsonStr.match(/"client_email"\s*:\s*"([^"]+)"/);
      const keyMatch = jsonStr.match(/"private_key"\s*:\s*"([\s\S]*?)"/);
      if (emailMatch?.[1] && keyMatch?.[1]) {
        return {
          clientEmail: emailMatch[1].trim(),
          privateKey: keyMatch[1].replace(/\\n/g, '\n'),
        };
      }
    }
  }

  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
  const key = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim();
  if (email && key) {
    return {
      clientEmail: email,
      privateKey: key.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getServiceAccountAccessToken(
  creds: ServiceAccountCreds
): Promise<string> {
  const now = Date.now();
  if (
    cachedToken &&
    cachedToken.email === creds.clientEmail &&
    cachedToken.expiresAt - 60_000 > now
  ) {
    return cachedToken.token;
  }

  const iat = Math.floor(now / 1000);
  const exp = iat + 3600;
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = toBase64Url(
    JSON.stringify({
      iss: creds.clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp,
      iat,
    })
  );

  const signingInput = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = toBase64Url(signer.sign(creds.privateKey));
  const jwt = `${signingInput}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
    cache: 'no-store',
  });

  const tokenData = (await tokenRes.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
    error?: string;
  };

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.error_description ||
        tokenData.error ||
        `Google Service Account token request failed (HTTP ${tokenRes.status}).`
    );
  }

  cachedToken = {
    token: tokenData.access_token,
    expiresAt: now + (tokenData.expires_in ?? 3600) * 1000,
    email: creds.clientEmail,
  };

  return tokenData.access_token;
}

async function fetchSheetViaServiceAccount(params: {
  spreadsheetId: string;
  gid: string | null;
  sheetName?: string;
  creds: ServiceAccountCreds;
}): Promise<SheetFetchResult> {
  const accessToken = await getServiceAccountAccessToken(params.creds);
  let targetTab = params.sheetName?.trim() || '';

  if (!targetTab) {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      params.spreadsheetId
    )}?fields=sheets.properties(sheetId,title)`;

    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    if (!metaRes.ok) {
      const errBody = (await metaRes.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (metaRes.status === 403 || metaRes.status === 404) {
        throw new Error(
          `Service Account (${params.creds.clientEmail}) cannot access this sheet. Share the Google Sheet with ${params.creds.clientEmail} as Viewer.`
        );
      }
      throw new Error(
        errBody?.error?.message ||
          `Google Sheets API metadata error (HTTP ${metaRes.status}).`
      );
    }

    const metaJson = (await metaRes.json()) as {
      sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
    };
    const sheets = Array.isArray(metaJson.sheets) ? metaJson.sheets : [];
    if (params.gid) {
      const byGid = sheets.find(
        (s) => String(s.properties?.sheetId ?? '') === params.gid
      );
      targetTab = byGid?.properties?.title || '';
    }
    if (!targetTab) {
      targetTab = sheets[0]?.properties?.title || 'Sheet1';
    }
  }

  const escapedTab = targetTab.replace(/'/g, "''");
  const range = encodeURIComponent(`'${escapedTab}'!A1:Z5000`);
  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    params.spreadsheetId
  )}/values/${range}`;

  const valuesRes = await fetch(valuesUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!valuesRes.ok) {
    const errBody = (await valuesRes.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    if (valuesRes.status === 403) {
      throw new Error(
        `Service Account (${params.creds.clientEmail}) needs Viewer permission on this Google Sheet.`
      );
    }
    throw new Error(
      errBody?.error?.message ||
        `Unable to read tab "${targetTab}" (HTTP ${valuesRes.status}).`
    );
  }

  const valuesJson = (await valuesRes.json()) as { values?: string[][] };
  const rows = Array.isArray(valuesJson.values)
    ? valuesJson.values.map((row) => row.map((cell) => String(cell ?? '')))
    : [];

  if (rows.length === 0) {
    throw new Error(`Tab "${targetTab}" appears to be empty.`);
  }

  return {
    spreadsheetId: params.spreadsheetId,
    gid: params.gid,
    rows,
    fetchedAt: new Date().toISOString(),
    authMode: 'service-account',
  };
}

async function fetchGoogleSheet(params: {
  urlOrId: string;
  sheetName?: string;
  gid?: string;
}): Promise<SheetFetchResult> {
  const {
    spreadsheetId,
    gid: extractedGid,
    publishedUrl,
  } = extractGoogleSheetInfo(params.urlOrId);
  if (!spreadsheetId) {
    throw new Error(
      'Invalid Google Sheet link or ID. Paste a link like https://docs.google.com/spreadsheets/d/...'
    );
  }

  const resolvedGid = params.gid || extractedGid;

  const serviceCreds = parseServiceAccountFromEnv();
  if (serviceCreds && !publishedUrl) {
    return fetchSheetViaServiceAccount({
      spreadsheetId,
      gid: resolvedGid,
      sheetName: params.sheetName,
      creds: serviceCreds,
    });
  }

  const cacheBust = Date.now();
  let exportUrl: string;

  if (publishedUrl) {
    exportUrl = `${publishedUrl}&_ts=${cacheBust}`;
  } else if (params.sheetName && params.sheetName.trim()) {
    exportUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
      spreadsheetId
    )}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(params.sheetName.trim())}&_ts=${cacheBust}`;
  } else if (resolvedGid) {
    exportUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
      spreadsheetId
    )}/export?format=csv&gid=${encodeURIComponent(resolvedGid)}&_ts=${cacheBust}`;
  } else {
    exportUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
      spreadsheetId
    )}/export?format=csv&_ts=${cacheBust}`;
  }

  const response = await fetch(exportUrl, {
    headers: {
      'User-Agent': 'Insight-Dashboard/1.0',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
    cache: 'no-store',
    redirect: 'follow',
  });

  if (!response.ok) {
    if (
      response.status === 401 ||
      response.status === 403 ||
      response.status === 404
    ) {
      throw new Error(
        'Cannot read this Google Sheet publicly. Share it as "Anyone with the link can view", configure a Google Service Account on Vercel, or use "Sign in with Google".'
      );
    }
    throw new Error(`Google Sheets returned HTTP ${response.status}.`);
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (
    contentType.includes('text/html') ||
    text.trimStart().startsWith('<!DOCTYPE') ||
    text.trimStart().startsWith('<html')
  ) {
    throw new Error(
      'This Google Sheet is private. Configure Google Service Account env vars on Vercel, set Share to "Anyone with the link can view", or click "Sign in with Google".'
    );
  }

  const rows = parseCsvText(text);
  if (rows.length === 0) {
    throw new Error('The Google Sheet appears to be empty.');
  }

  return {
    spreadsheetId,
    gid: resolvedGid,
    rows,
    fetchedAt: new Date().toISOString(),
    authMode: 'public-csv',
  };
}

export default async function handler(req: VercelReq, res: VercelRes) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checkOnly = getParam(req, 'check') === '1';
  const defaultEnvUrl = process.env.GOOGLE_SHEET_URL || '';
  const serviceCreds = parseServiceAccountFromEnv();

  if (checkOnly) {
    return res.status(200).json({
      hasDefaultEnvSheet: Boolean(defaultEnvUrl.trim()),
      hasServiceAccount: serviceCreds !== null,
    });
  }

  const requestedUrl = getParam(req, 'url').trim();
  const sheetName = getParam(req, 'sheet').trim();
  const gid = getParam(req, 'gid').trim();

  const targetUrl = requestedUrl || defaultEnvUrl.trim();
  if (!targetUrl) {
    return res.status(400).json({
      error:
        'No Google Sheet URL provided. Paste a sheet link or set GOOGLE_SHEET_URL in Vercel.',
    });
  }

  try {
    const result = await fetchGoogleSheet({
      urlOrId: targetUrl,
      sheetName: sheetName || undefined,
      gid: gid || undefined,
    });
    return res.status(200).json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to fetch Google Sheet.';
    return res.status(400).json({ error: message });
  }
}
