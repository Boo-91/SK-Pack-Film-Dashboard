import crypto from 'node:crypto';
import { extractGoogleSheetInfo, parseCsvText } from './sheetParser.ts';

export interface PublicSheetFetchResult {
  spreadsheetId: string;
  gid: string | null;
  rows: string[][];
  fetchedAt: string;
  authMode?: 'service-account' | 'public-csv';
}

interface ServiceAccountCreds {
  clientEmail: string;
  privateKey: string;
}

const FIREBASE_PROJECT_ID = 'gen-lang-client-0455817746';
const ALLOWED_EMAIL_DOMAIN = 'dplusonline.net';
const FIREBASE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts: { certs: Record<string, string>; expiresAt: number } | null =
  null;

function decodeBase64UrlJson<T>(segment: string): T {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(padded, 'base64').toString('utf8');
  return JSON.parse(json) as T;
}

async function getFirebasePublicCerts(
  forceRefresh = false
): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && cachedCerts && cachedCerts.expiresAt > now) {
    return cachedCerts.certs;
  }

  const res = await fetch(FIREBASE_CERTS_URL, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Unable to fetch Google Auth certificates (HTTP ${res.status}).`);
  }
  const certs = (await res.json()) as Record<string, string>;
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedCerts = {
    certs,
    expiresAt: now + Math.max(60, maxAgeSec) * 1000,
  };
  return certs;
}

export class AuthHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function verifyCompanyFirebaseToken(
  authHeaderValue: string | string[] | undefined
): Promise<{ email: string; uid: string }> {
  const rawHeader = Array.isArray(authHeaderValue)
    ? authHeaderValue[0] || ''
    : authHeaderValue || '';
  const match = rawHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();

  if (!token) {
    throw new AuthHttpError(
      401,
      `Authentication required. Sign in with an @${ALLOWED_EMAIL_DOMAIN} Google account.`
    );
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AuthHttpError(401, 'Invalid authentication token format.');
  }

  let header: { alg?: string; kid?: string };
  let payload: {
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    email?: string;
    email_verified?: boolean;
  };

  try {
    header = decodeBase64UrlJson(parts[0]);
    payload = decodeBase64UrlJson(parts[1]);
  } catch {
    throw new AuthHttpError(401, 'Unable to decode authentication token.');
  }

  if (header.alg !== 'RS256' || !header.kid) {
    throw new AuthHttpError(401, 'Unsupported authentication token algorithm.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;

  if (
    payload.aud !== FIREBASE_PROJECT_ID ||
    payload.iss !== expectedIssuer ||
    !payload.sub ||
    typeof payload.exp !== 'number' ||
    payload.exp <= nowSec
  ) {
    throw new AuthHttpError(401, 'Session expired or invalid. Please sign in again.');
  }

  let certs = await getFirebasePublicCerts(false);
  let pem = certs[header.kid];
  if (!pem) {
    certs = await getFirebasePublicCerts(true);
    pem = certs[header.kid];
  }
  if (!pem) {
    throw new AuthHttpError(401, 'Unable to match signing key for session token.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();
  const sig = Buffer.from(
    parts[2].replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  );
  if (!verifier.verify(pem, sig)) {
    throw new AuthHttpError(401, 'Invalid session token signature.');
  }

  const email = (payload.email || '').trim().toLowerCase();
  const atIndex = email.lastIndexOf('@');
  const domain = atIndex > 0 ? email.slice(atIndex + 1) : '';
  if (domain !== ALLOWED_EMAIL_DOMAIN || payload.email_verified !== true) {
    throw new AuthHttpError(
      403,
      `Access denied for ${email || 'this account'}. Only @${ALLOWED_EMAIL_DOMAIN} Google accounts are permitted.`
    );
  }

  return { email, uid: payload.sub };
}

let cachedToken: { token: string; expiresAt: number; email: string } | null =
  null;

function parseServiceAccountFromEnv(): ServiceAccountCreds | null {
  const rawJson = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim();
  if (rawJson) {
    try {
      const jsonStr = rawJson.startsWith('{')
        ? rawJson
        : Buffer.from(rawJson, 'base64').toString('utf8');
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
      // Fall through to individual env vars
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

export function hasServiceAccountCredentials(): boolean {
  return parseServiceAccountFromEnv() !== null;
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
}): Promise<PublicSheetFetchResult> {
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

export async function fetchPublicGoogleSheet(params: {
  urlOrId: string;
  sheetName?: string;
  gid?: string;
}): Promise<PublicSheetFetchResult> {
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

  // Prefer server-side Google Service Account when configured in environment variables
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
        'Cannot read this Google Sheet publicly. Either share it with "Anyone with the link can view", configure a Google Service Account on Vercel, or use "Sign in with Google".'
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
