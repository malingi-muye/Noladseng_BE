import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import contactRoutes from '../server/routes/contact';
import quotesEmailRoutes from '../server/routes/quotes-email';
import analyticsRoutes from '../server/routes/analyticsRoutes';

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

// API Routes
app.use("/api/contact", contactRoutes);
app.use("/api/quotes", quotesEmailRoutes);
app.use("/api", analyticsRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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
