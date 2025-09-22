import type { VercelRequest, VercelResponse } from '@vercel/node';

function pickAllowedOrigin(reqOrigin: string | undefined): string | undefined {
  const raw = process.env.CORS_ORIGIN || '';
  // Provide a sensible default whitelist when env var is missing
  const defaultList = ['http://localhost:5173', 'https://noladseng.com', 'https://www.noladseng.com'];
  const list = (raw ? raw.split(',') : defaultList).map(s => s.trim()).filter(Boolean);

  // If client didn't send an Origin header, prefer the first allowed origin
  if (!reqOrigin) return list[0] || '*';
  if (list.length === 0) return '*';
  if (list.includes('*')) return '*';
  if (list.includes(reqOrigin)) return reqOrigin;
  for (const entry of list) {
    if (entry.includes('*')) {
      const escaped = entry.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '.*');
      try {
        const re = new RegExp(`^${escaped}$`);
        if (re.test(reqOrigin)) return reqOrigin;
      } catch {}
    }
  }
  return list[0];
}

export function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = pickAllowedOrigin(req.headers.origin as string | undefined);
  // Always set an explicit header so preflight checks pass
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  // Debug logging to help diagnose deployed CORS failures
  try {
    // Avoid throwing when res has no console in some environments
    console.log('[CORS] request origin:', req.headers.origin, 'selected:', origin || '*');
  } catch {}
  // When echoing back a specific origin, inform caches to vary
  if (origin && origin !== '*') res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export function handlePreflight(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res);
    res.status(200).end();
    return true;
  }
  return false;
}


