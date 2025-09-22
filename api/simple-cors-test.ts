import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple CORS headers without external imports
  const origin = req.headers.origin as string;
  const allowedOrigins = [
    'https://noladseng.com',
    'https://www.noladseng.com',
    'http://localhost:5173'
  ];
  
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : '*';
  
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (origin && origin !== '*') {
    res.setHeader('Vary', 'Origin');
  }
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Log request details
  console.log('[Simple CORS Test] Request details:', {
    method: req.method,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    url: req.url
  });
  
  return res.status(200).json({
    success: true,
    message: 'Simple CORS test successful',
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
