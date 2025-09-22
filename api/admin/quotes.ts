import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../server/supabaseAdmin.js';
import type { ApiResponse } from '../../shared/index.js';
import { authenticateAdmin, validateRequestBody } from '../../serverless/admin-auth.js';
import { createCrudHandlers } from '../../server/utils/crud-factory.js';
import { applyCors, handlePreflight } from '../../serverless/_cors';

// Create CRUD handlers for quotes
const {
  getAll,
  getById,
  create,
  update,
  remove
} = createCrudHandlers({
  tableName: 'quote_requests',
  supabase: supabaseAdmin
});

// Extend the standard getAll handler to add quote-specific filtering
const getAllQuotes = async (req: VercelRequest, res: VercelResponse) => {
  const { status, budget_range } = req.query;
  
  // Build query filters based on parameters
  let query = supabaseAdmin.from('quote_requests').select('*');
  
  if (status) {
    query = query.eq('status', status);
  }
  
  if (budget_range) {
    query = query.eq('budget_range', budget_range);
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
      .from('quote_requests')
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
        error: `Failed to fetch quote requests: ${error.message}`
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
      error: `Error fetching quote requests: ${error.message}`
    });
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  if (handlePreflight(req, res)) return;

  // Authenticate admin for all operations
  const isAuthenticated = await authenticateAdmin(req, res);
  if (!isAuthenticated) {
    return;
  }

  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Admin Quotes ${requestId}] ${req.method} ${req.url}`, {
    params: req.query,
    body: req.body,
  });

  try {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          return getById(req, res);
        } else {
          return getAllQuotes(req, res);
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
    console.error(`[Admin Quotes ${requestId}] Error:`, error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
}
