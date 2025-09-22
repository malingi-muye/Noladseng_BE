import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleContact, handleContactSend } from '../serverless/routes/contact';
import { handleQuote } from '../serverless/routes/quotes';
import { handleAnalytics } from '../serverless/routes/analytics';

const ALLOWLIST = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = (req.headers.origin as string) || '';
  const allowed = ALLOWLIST.length === 0 || ALLOWLIST.includes(origin);
  if (allowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url || '';
  console.log(`[API] ${req.method} ${url}`);

  if (url.startsWith('/api/health')) {
    return res.json({ success: true, data: { status: 'ok', ts: new Date().toISOString() } });
  }

  if (url.startsWith('/api/contact/send')) return handleContactSend(req, res);
  if (url.startsWith('/api/contact')) return handleContact(req, res);
  if (url.startsWith('/api/quotes')) return handleQuote(req, res);
  if (url.startsWith('/api/analytics/')) return handleAnalytics(req, res);

  return res.status(404).json({ success: false, error: 'API endpoint not found' });
}
