import express from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { authenticateAdmin, validateRequestBody, requestLogger } from '../middleware/admin.js';
import { createCrudHandlers } from '../utils/crud-factory.js';
import { emitProductUpdate } from '../utils/socket.js';
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
// Get CRUD handlers for products
const { getAll, getById, create, update, remove } = createCrudHandlers({
    tableName: 'products',
    supabase: supabaseAdmin
});
// Extend the standard getAll handler to add product-specific filtering
const getAllProducts = async (req, res) => {
    // Add custom query parameters for product-specific filtering
    const { category, minPrice, maxPrice, inStock } = req.query;
    // Pass these as filters to the standard getAll handler
    const filters = {};
    if (category)
        filters.category = category;
    if (inStock !== undefined)
        filters.in_stock = inStock === 'true';
    if (minPrice)
        filters.price = `gte.${minPrice}`;
    if (maxPrice)
        filters.price = `lte.${maxPrice}`;
    req.query = {
        ...req.query,
        filters: JSON.stringify(filters)
    };
    return getAll(req, res);
};
// GET /api/admin/products - List all products with advanced filtering
router.get('/', authenticateAdmin, getAllProducts);
// GET /api/admin/products/:id - Get single product
router.get('/:id', authenticateAdmin, getById);
// Custom handlers that emit WebSocket events
const createProduct = async (req, res) => {
    const result = await create(req, res);
    if (res.statusCode === 200 || res.statusCode === 201) {
        emitProductUpdate();
    }
    return result;
};
const updateProduct = async (req, res) => {
    const result = await update(req, res);
    if (res.statusCode === 200) {
        emitProductUpdate();
    }
    return result;
};
const deleteProduct = async (req, res) => {
    const result = await remove(req, res);
    if (res.statusCode === 200) {
        emitProductUpdate();
    }
    return result;
};
// POST /api/admin/products - Create new product
router.post('/', [authenticateAdmin, validateRequestBody], createProduct);
// PUT /api/admin/products/:id - Update product
router.put('/:id', [authenticateAdmin, validateRequestBody], updateProduct);
// DELETE /api/admin/products/:id - Delete product
router.delete('/:id', authenticateAdmin, deleteProduct);
export default router;
