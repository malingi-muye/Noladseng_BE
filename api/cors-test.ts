import { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, handlePreflight } from '../serverless/_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  
  if (handlePreflight(req, res)) return;

  // Log request details for debugging
  console.log('[CORS Test] Request details:', {
    method: req.method,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    host: req.headers.host,
    url: req.url,
    headers: req.headers
  });

  // Return CORS test response
  return res.status(200).json({
    success: true,
    message: 'CORS test successful',
    data: {
      method: req.method,
      origin: req.headers.origin,
      timestamp: new Date().toISOString(),
      corsHeaders: {
        'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials'),
        'Access-Control-Max-Age': res.getHeader('Access-Control-Max-Age'),
        'Vary': res.getHeader('Vary')
      }
    }
  });
}
