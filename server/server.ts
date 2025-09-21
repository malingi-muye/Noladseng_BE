import "dotenv/config";
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { Request, Response, NextFunction } from "express";
import contactRoutes from "./routes/contact";
import quotesEmailRoutes from "./routes/quotes-email";
import analyticsRoutes from "./routes/analyticsRoutes";
import { setSocketIO } from "./utils/socket";

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'https://noladseng.com'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 8000;

// Initialize socket utility
setSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  
  // Handle product updates
  socket.on('products:update', () => {
    console.log(`[Socket.IO] Broadcasting products:update from ${socket.id}`);
    socket.broadcast.emit('products:update');
  });
  
  // Handle service updates
  socket.on('services:update', () => {
    console.log(`[Socket.IO] Broadcasting services:update from ${socket.id}`);
    socket.broadcast.emit('services:update');
  });
  
  // Handle testimonial updates
  socket.on('testimonials:update', () => {
    console.log(`[Socket.IO] Broadcasting testimonials:update from ${socket.id}`);
    socket.broadcast.emit('testimonials:update');
  });
  
  // Handle blog updates
  socket.on('blog:update', () => {
    console.log(`[Socket.IO] Broadcasting blog:update from ${socket.id}`);
    socket.broadcast.emit('blog:update');
  });
  
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// API Routes
app.use("/api/contact", contactRoutes);
app.use("/api/quotes", quotesEmailRoutes);
app.use("/api", analyticsRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Serve Vite build output
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");
app.use(express.static(distDir));

// SPA fallback to index.html for client-side routing
app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

// Error handler (keep last)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  res
    .status(500)
    .json({ success: false, error: "Server error", details: err?.message || String(err) });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Socket.IO server ready for WebSocket connections`);
});
