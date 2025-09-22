import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Request logging
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Catch-all route for unmatched API paths
  return res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    message: 'This is a catch-all handler. Make sure your API routes are properly configured in vercel.json',
    availableEndpoints: [
      '/api/health',
      '/api/contact',
      '/api/quotes',
      '/api/analytics/overview',
      '/api/analytics/realtime',
      '/api/analytics/conversions',
      '/api/admin/products',
      '/api/admin/blog',
      '/api/admin/services',
      '/api/admin/testimonials',
      '/api/admin/quotes',
      '/api/admin/contacts'
    ]
  });
}
