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
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    console.log('[Simple Contact] Request body:', req.body);
    const { name, email, message } = req.body || {};
    
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'name, email, and message are required' 
      });
    }
    
    // For testing, just return success without database operations
    return res.json({ 
      success: true, 
      message: 'Contact message received (test mode)',
      data: { name, email, message }
    });
    
  } catch (error: any) {
    console.error('Simple Contact handler error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error?.message || 'Failed to process contact message' 
    });
  }
}
