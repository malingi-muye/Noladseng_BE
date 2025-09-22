import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../server/supabaseAdmin.js';
import type { Product, ApiResponse } from '../../shared/index.js';
import { authenticateAdmin, validateRequestBody, setupCors, handleOptions } from './auth.js';
import { createCrudHandlers } from '../../server/utils/crud-factory.js';

// Create CRUD handlers for products
const {
  getAll,
  getById,
  create,
  update,
  remove
} = createCrudHandlers({
  tableName: 'products',
  supabase: supabaseAdmin
});

// Extend the standard getAll handler to add product-specific filtering
const getAllProducts = async (req: VercelRequest, res: VercelResponse) => {
  const { category, minPrice, maxPrice, inStock } = req.query;
  
  // Build query filters based on parameters
  let query = supabaseAdmin.from('products').select('*');
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (inStock !== undefined) {
    query = query.eq('in_stock', inStock === 'true');
  }
  
  if (minPrice) {
    query = query.gte('price', Number(minPrice));
  }
  
  if (maxPrice) {
    query = query.lte('price', Number(maxPrice));
  }

  // Handle pagination
  const { page = '1', limit = '10' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10));
  const pageSize = Math.max(1, Math.min(100, parseInt(limit as string, 10)));
  const from = (pageNum - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    // Get total count
    const { count, error: countError } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch total count'
      });
    }

    const total = count || 0;

    // Execute final query with pagination
    const { data, error } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch products: ${error.message}`
      });
    }

    const response: ApiResponse = {
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    };

    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error fetching products: ${error.message}`
    });
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setupCors(res);
  
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  // Authenticate admin for all operations
  const isAuthenticated = await authenticateAdmin(req, res);
  if (!isAuthenticated) {
    return;
  }

  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Admin Products ${requestId}] ${req.method} ${req.url}`, {
    params: req.query,
    body: req.body,
  });

  try {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          return getById(req, res);
        } else {
          return getAllProducts(req, res);
        }
      
      case 'POST':
        if (!validateRequestBody(req, res)) return;
        return create(req, res);
      
      case 'PUT':
        if (!validateRequestBody(req, res)) return;
        return update(req, res);
      
      case 'DELETE':
        return remove(req, res);
      
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error: any) {
    console.error(`[Admin Products ${requestId}] Error:`, error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
}
