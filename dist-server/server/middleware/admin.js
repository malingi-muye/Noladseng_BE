import { assertAdminFromBearer } from '../supabaseAdmin.js';
// Authentication middleware
export const authenticateAdmin = async (req, res, next) => {
    const auth = await assertAdminFromBearer(req.headers.authorization);
    if (!auth.ok) {
        return res.status(auth.status).json({
            success: false,
            error: auth.message,
        });
    }
    next();
};
// Validation middleware for request body
export const validateRequestBody = (req, res, next) => {
    if (!req.headers['content-type']?.includes('application/json')) {
        return res.status(400).json({
            success: false,
            error: 'Content-Type must be application/json',
        });
    }
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
            success: false,
            error: 'Request body must be a valid JSON object',
        });
    }
    next();
};
// Request logging middleware with request ID
export const requestLogger = (req, res, next) => {
    const requestId = Math.random().toString(36).substring(7);
    res.locals.requestId = requestId;
    console.log(`[Admin ${requestId}] ${req.method} ${req.originalUrl}`, {
        params: req.params,
        query: req.query,
        path: req.path,
        body: req.body,
        auth: req.headers.authorization ? 'Present' : 'Missing',
    });
    next();
};
// Common CORS OPTIONS handler
export const handleOptions = (req, res) => {
    res.sendStatus(200);
};
