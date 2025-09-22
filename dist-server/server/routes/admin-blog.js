import express from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { authenticateAdmin, validateRequestBody, requestLogger } from '../middleware/admin.js';
import { createCrudHandlers } from '../utils/crud-factory.js';
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
// Get CRUD handlers for blog posts
const { getAll, getById, create, update, remove } = createCrudHandlers({
    tableName: 'blog_posts',
    supabase: supabaseAdmin
});
// Extend the standard getAll handler to add blog-specific filtering
const getAllPosts = async (req, res) => {
    const { category, tag, status, authorId, ...rest } = req.query;
    // Build query filters based on parameters
    let query = supabaseAdmin.from('blog_posts')
        .select(`
      *,
      authors (
        id,
        name,
        avatar_url
      ),
      categories (
        id,
        name
      ),
      tags (
        id,
        name
      )
    `);
    if (category) {
        query = query.eq('category_id', category);
    }
    if (status) {
        query = query.eq('status', status);
    }
    if (authorId) {
        query = query.eq('author_id', authorId);
    }
    // Order by published_at or created_at
    query = query.order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
    try {
        const { data, error } = await query;
        if (error)
            throw error;
        // If tag filter is present, filter in memory (since tags are in an array)
        let filteredData = data;
        if (tag) {
            filteredData = data.filter(post => post.tags?.some((t) => t.name === tag || t.id === tag));
        }
        return res.json({
            success: true,
            data: filteredData
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch blog posts'
        });
    }
};
// Custom create handler to handle relationships
const createPost = async (req, res) => {
    const { tags, ...postData } = req.body;
    try {
        // Start a transaction
        const { data, error } = await supabaseAdmin.rpc('create_blog_post', {
            post_data: postData,
            tag_ids: tags
        });
        if (error)
            throw error;
        return res.status(201).json({
            success: true,
            data
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create blog post'
        });
    }
};
// Custom update handler to handle relationships
const updatePost = async (req, res) => {
    const { id } = req.params;
    const { tags, ...updates } = req.body;
    try {
        // Update post and relationships in a transaction
        const { data, error } = await supabaseAdmin.rpc('update_blog_post', {
            post_id: id,
            post_updates: updates,
            tag_ids: tags
        });
        if (error)
            throw error;
        return res.json({
            success: true,
            data
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to update blog post'
        });
    }
};
// GET /api/admin/blog - List all posts with advanced filtering
router.get('/', authenticateAdmin, getAllPosts);
// GET /api/admin/blog/:id - Get single post
router.get('/:id', authenticateAdmin, getById);
// POST /api/admin/blog - Create new post
router.post('/', [authenticateAdmin, validateRequestBody], createPost);
// PUT /api/admin/blog/:id - Update post
router.put('/:id', [authenticateAdmin, validateRequestBody], updatePost);
// DELETE /api/admin/blog/:id - Delete post
router.delete('/:id', authenticateAdmin, remove);
export default router;
