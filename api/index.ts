import { VercelRequest, VercelResponse } from '@vercel/node';

// Simple health check handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle health check
  if (req.method === 'GET' && req.url === '/api/health') {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      message: "Vercel backend is working!"
    });
    return;
  }

  // Handle contact form submission
  if (req.method === 'POST' && req.url === '/api/contact') {
    try {
      const { name, email, subject, message } = req.body;
      
      // Basic validation
      if (!name || !email || !message) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: name, email, message"
        });
        return;
      }

      // Log the contact form submission
      console.log('Contact form submission:', { name, email, subject, message });

      // For now, just return success
      // In production, you'd integrate with your email service here
      res.status(200).json({
        success: true,
        message: "Contact form submitted successfully",
        data: { name, email, subject, message }
      });
      return;
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to process contact form"
      });
      return;
    }
  }

  // Handle quotes form submission
  if (req.method === 'POST' && req.url === '/api/quotes') {
    try {
      const quoteData = req.body;
      
      // Log the quote submission
      console.log('Quote form submission:', quoteData);

      // For now, just return success
      res.status(200).json({
        success: true,
        message: "Quote request submitted successfully",
        data: quoteData
      });
      return;
    } catch (error) {
      console.error('Quote form error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to process quote request"
      });
      return;
    }
  }

  // Handle 404 for other routes
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    availableEndpoints: [
      "GET /api/health",
      "POST /api/contact",
      "POST /api/quotes"
    ]
  });
}
