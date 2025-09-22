import { VercelRequest, VercelResponse } from '@vercel/node';
import { assertAdminFromBearer } from '../../server/supabaseAdmin.js';

export async function authenticateAdmin(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  const auth = await assertAdminFromBearer(req.headers.authorization as string | undefined);
  if (!auth.ok) {
    res.status(auth.status).json({
      success: false,
      error: auth.message,
    });
    return false;
  }
  return true;
}

export function validateRequestBody(req: VercelRequest, res: VercelResponse): boolean {
  if (!req.headers['content-type']?.includes('application/json')) {
    res.status(400).json({
      success: false,
      error: 'Content-Type must be application/json',
    });
    return false;
  }

  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({
      success: false,
      error: 'Request body must be a valid JSON object',
    });
    return false;
  }

  return true;
}

export function setupCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(res: VercelResponse) {
  res.status(200).end();
}
