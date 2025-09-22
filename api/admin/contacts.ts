import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../server/supabaseAdmin.js';
import { assertAdminFromBearer } from '../../server/supabaseAdmin.js';
import type { ApiResponse } from '../../shared/index.js';

// Helper function to create CRUD operations for serverless
const createCrudHandler = (tableName: string) => ({
  getAll: async (req: VercelRequest, res: VercelResponse, filters: any = {}) => {
    try {
      const { search, page = '1', limit = '10', ...queryFilters } = req.query;
      let query = supabaseAdmin.from(tableName).select('*');

      // Apply filters
      Object.entries({ ...filters, ...queryFilters }).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          query = query.eq(key, value);
        }
      });

      // Handle pagination
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const pageSize = Math.max(1, Math.min(100, parseInt(limit as string, 10)));
      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;

      // Get total count
      const { count } = await supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      const total = count || 0;

      // Execute final query with pagination
      const { data, error } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          error: `Failed to fetch ${tableName}`,
        } satisfies ApiResponse);
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
        error: `Error fetching ${tableName}`,
      } satisfies ApiResponse);
    }
  },

  getById: async (req: VercelRequest, res: VercelResponse) => {
    try {
      const { id } = req.query;
      const parsedId = parseInt(id as string, 10);
      
      if (!Number.isFinite(parsedId)) {
        return res.status(400).json({
          success: false,
          error: 'ID must be a valid number',
        } satisfies ApiResponse);
      }

      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('id', parsedId)
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: `Failed to fetch ${tableName}`,
        } satisfies ApiResponse);
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
        } satisfies ApiResponse);
      }

      return res.json({
        success: true,
        data,
      } satisfies ApiResponse);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: `Error fetching ${tableName}`,
      } satisfies ApiResponse);
    }
  },

  update: async (req: VercelRequest, res: VercelResponse) => {
    try {
      const { id } = req.query;
      const parsedId = parseInt(id as string, 10);
      
      if (!Number.isFinite(parsedId)) {
        return res.status(400).json({
          success: false,
          error: 'ID must be a valid number',
        } satisfies ApiResponse);
      }

      // Check if exists
      const { data: existing } = await supabaseAdmin
        .from(tableName)
        .select('id')
        .eq('id', parsedId)
        .single();

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
        } satisfies ApiResponse);
      }

      // Perform update
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .update(req.body)
        .eq('id', parsedId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          success: false,
          error: `Failed to update ${tableName}`,
        } satisfies ApiResponse);
      }

      return res.json({
        success: true,
        data,
      } satisfies ApiResponse);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: `Error updating ${tableName}`,
      } satisfies ApiResponse);
    }
  },

  remove: async (req: VercelRequest, res: VercelResponse) => {
    try {
      const { id } = req.query;
      const parsedId = parseInt(id as string, 10);
      
      if (!Number.isFinite(parsedId)) {
        return res.status(400).json({
          success: false,
          error: 'ID must be a valid number',
        } satisfies ApiResponse);
      }

      // Check if exists
      const { data: existing } = await supabaseAdmin
        .from(tableName)
        .select('id')
        .eq('id', parsedId)
        .single();

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
        } satisfies ApiResponse);
      }

      // Perform deletion
      const { error } = await supabaseAdmin
        .from(tableName)
        .delete()
        .eq('id', parsedId);

      if (error) {
        return res.status(400).json({
          success: false,
          error: `Failed to delete ${tableName}`,
        } satisfies ApiResponse);
      }

      return res.json({
        success: true,
        data: { message: `${tableName} deleted successfully` },
      } satisfies ApiResponse);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: `Error deleting ${tableName}`,
      } satisfies ApiResponse);
    }
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authenticate admin for all operations except OPTIONS
  const auth = await assertAdminFromBearer(req.headers.authorization);
  if (!auth.ok) {
    return res.status(auth.status).json({
      success: false,
      error: auth.message,
    } satisfies ApiResponse);
  }

  // Validate content type for POST/PUT requests
  if ((req.method === 'POST' || req.method === 'PUT') && 
      !req.headers['content-type']?.includes('application/json')) {
    return res.status(400).json({
      success: false,
      error: 'Content-Type must be application/json',
    } satisfies ApiResponse);
  }

  const crud = createCrudHandler('contact_messages');

  try {
    switch (req.method) {
      case 'GET':
        // Check if we're getting a specific contact by ID
        if (req.query.id) {
          return await crud.getById(req, res);
        }
        // Otherwise get all contacts with filtering
        return await crud.getAll(req, res);
      
      case 'PUT':
        return await crud.update(req, res);
      
      case 'DELETE':
        return await crud.remove(req, res);
      
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        } satisfies ApiResponse);
    }
  } catch (error: any) {
    console.error('Contacts handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } satisfies ApiResponse);
  }
}
