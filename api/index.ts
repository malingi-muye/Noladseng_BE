import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'https://noladseng.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Contact route (simplified for Vercel)
app.post("/api/contact", async (req, res) => {
  try {
    console.log('Contact form submission:', req.body);
    
    // For now, just return success
    // You can add email sending logic here later
    res.json({
      success: true,
      message: "Contact form submitted successfully"
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to submit contact form"
    });
  }
});

// Quotes route (simplified for Vercel)
app.post("/api/quotes", async (req, res) => {
  try {
    console.log('Quote request submission:', req.body);
    
    // For now, just return success
    // You can add email sending logic here later
    res.json({
      success: true,
      message: "Quote request submitted successfully"
    });
  } catch (error) {
    console.error('Quote request error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to submit quote request"
    });
  }
});

// Analytics route (simplified for Vercel)
app.get("/api/analytics/:path*", (req, res) => {
  res.json({
    success: true,
    message: "Analytics endpoint - not implemented yet"
  });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("API Error:", err);
  res.status(500).json({ 
    success: false, 
    error: "Internal server error", 
    details: err?.message || String(err) 
  });
});

export default app;
