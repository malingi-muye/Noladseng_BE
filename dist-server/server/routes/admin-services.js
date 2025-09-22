import express from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { authenticateAdmin, validateRequestBody, requestLogger } from '../middleware/admin.js';
import { createCrudHandlers } from '../utils/crud-factory.js';
import { emitServiceUpdate } from '../utils/socket.js';
const router = express.Router();
// Add logging middleware and CORS handling
router.use(requestLogger);
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
// Get CRUD handlers for services
const { getAll, getById, create, update, remove } = createCrudHandlers({
    tableName: 'services',
    supabase: supabaseAdmin
});
// GET /api/admin/services - List all services
router.get('/', authenticateAdmin, getAll);
// GET /api/admin/services/:id - Get single service
router.get('/:id', authenticateAdmin, getById);
// Custom handlers that emit WebSocket events
const createService = async (req, res) => {
    const result = await create(req, res);
    if (res.statusCode === 200 || res.statusCode === 201) {
        emitServiceUpdate();
    }
    return result;
};
const updateService = async (req, res) => {
    const result = await update(req, res);
    if (res.statusCode === 200) {
        emitServiceUpdate();
    }
    return result;
};
const deleteService = async (req, res) => {
    const result = await remove(req, res);
    if (res.statusCode === 200) {
        emitServiceUpdate();
    }
    return result;
};
// POST /api/admin/services - Create new service
router.post('/', [authenticateAdmin, validateRequestBody], createService);
// PUT /api/admin/services/:id - Update service
router.put('/:id', [authenticateAdmin, validateRequestBody], updateService);
// DELETE /api/admin/services/:id - Delete service
router.delete('/:id', authenticateAdmin, deleteService);
export default router;
