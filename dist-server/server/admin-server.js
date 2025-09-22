import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import adminTestimonials from './routes/admin-testimonials.js';
import adminServices from './routes/admin-services.js';
import adminProducts from './routes/admin-products.js';
import adminQuotes from './routes/admin-quotes.js';
import adminBlog from './routes/admin-blog.js';
import adminContacts from './routes/admin-contacts.js';
import contactEmail from './routes/contact.js';
import quotesEmail from './routes/quotes-email.js';
import { setSocketIO } from './utils/socket.js';
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
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: process.env.UPLOAD_MAX_SIZE || '2mb' }));
// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`[Admin Socket.IO] Client connected: ${socket.id}`);
    // Handle product updates
    socket.on('products:update', () => {
        console.log(`[Admin Socket.IO] Broadcasting products:update from ${socket.id}`);
        socket.broadcast.emit('products:update');
    });
    // Handle service updates
    socket.on('services:update', () => {
        console.log(`[Admin Socket.IO] Broadcasting services:update from ${socket.id}`);
        socket.broadcast.emit('services:update');
    });
    // Handle testimonial updates
    socket.on('testimonials:update', () => {
        console.log(`[Admin Socket.IO] Broadcasting testimonials:update from ${socket.id}`);
        socket.broadcast.emit('testimonials:update');
    });
    // Handle blog updates
    socket.on('blog:update', () => {
        console.log(`[Admin Socket.IO] Broadcasting blog:update from ${socket.id}`);
        socket.broadcast.emit('blog:update');
    });
    socket.on('disconnect', () => {
        console.log(`[Admin Socket.IO] Client disconnected: ${socket.id}`);
    });
});
// Mount admin routes
app.use('/api/admin/testimonials', adminTestimonials);
app.use('/api/admin/services', adminServices);
app.use('/api/admin/products', adminProducts);
app.use('/api/admin/quotes', adminQuotes);
app.use('/api/admin/blog', adminBlog);
app.use('/api/admin/contacts', adminContacts);
// Public email notify endpoints
app.use('/api/contact', contactEmail);
app.use('/api/quotes', quotesEmail);
// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Server error',
        details: err.message
    });
});
server.listen(PORT, () => {
    console.log(`Admin API server running on port ${PORT}`);
    console.log(`Admin Socket.IO server ready for WebSocket connections`);
});
