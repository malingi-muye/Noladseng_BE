import type { VercelRequest, VercelResponse } from '@vercel/node';

function pickAllowedOrigin(reqOrigin: string | undefined): string | undefined {
  const raw = process.env.CORS_ORIGIN || '';
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (!reqOrigin) return list[0] || '*';
  if (list.length === 0) return '*';
  if (list.includes('*')) return '*';
  if (list.includes(reqOrigin)) return reqOrigin;
  // Support subdomain wildcards like https://*.example.com
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
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
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

