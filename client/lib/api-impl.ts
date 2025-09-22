import { supabase } from './supabase';
import type { ApiResponse } from '../types/api';
import type { SupabaseApiClient } from '../types/supabase';
import type { ContactMessage } from '@shared/api';
import { ga4Client } from './analytics';

// Helper function to format Supabase responses as ApiResponse
function isNetworkError(err: any): boolean {
  try {
    const msg = typeof err === 'string' ? err : (err?.message || err?.error_description || '');
    return /Failed to fetch|NetworkError|TypeError|Edge Function/i.test(String(msg));
  } catch {
    return false;
  }
}
function isAuthSessionMissing(err: any): boolean {
  try {
    const msg = typeof err === 'string' ? err : (err?.message || err?.error_description || '');
    return /Auth session missing/i.test(String(msg));
  } catch {
    return false;
  }
}
function formatResponse<T>(data: T | null, error: any = null, endpoint?: string): ApiResponse<T> {
  const errMsg = error
    ? (typeof error === 'string'
        ? error
        : (error?.message || error?.error_description || error?.hint || null))
    : null;

  // Debug logging (downgrade network noise to warn)
  if (errMsg) {
    if (isNetworkError(error)) {
      console.warn(`[Supabase API Warning] ${endpoint || 'unknown endpoint'}: ${errMsg}`);
    } else {
      console.error(`[Supabase API Error] ${endpoint || 'unknown endpoint'}: ${errMsg}`);
    }
  } else {
    console.log(`[Supabase API] ${endpoint || 'unknown endpoint'}: ok`);
  }

  if (error) {
    return {
      success: false,
      error: errMsg || 'An error occurred',
      details: error,
    };
  }

  return {
    success: true,
    data: data as T,
  };
}

// Create the API client
// Helper to call server-side admin APIs with Bearer token
async function getBearerToken(): Promise<string | undefined> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || undefined;
  } catch {
    return undefined;
  }
}
async function adminFetch<T>(path: string, init: RequestInit): Promise<ApiResponse<T>> {
  try {
    const token = await getBearerToken();
    console.log('[adminFetch] Token status:', { 
      hasToken: !!token, 
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'None'
    });
    
    // Ensure path starts with a slash and prepend base URL if needed
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    
    // Use environment-based API URL
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const url = new URL(fullPath, baseUrl).toString();

    // Log request details
    console.log('[adminFetch] Request:', {
      url,
      method: init.method,
      headers: {
        ...init.headers,
        'Authorization': token ? 'Bearer present' : 'Missing'
      },
      body: init.body ? JSON.parse(init.body as string) : undefined
    });
    
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    // Log response details
    console.log('[adminFetch] Response:', {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries())
    });

    // Read body ONCE safely. Use clone() to avoid "body stream already read" if another middleware consumed it.
    let text = '';
    try {
      text = await res.clone().text();
      console.log('[adminFetch] Response body:', text);
    } catch (e) {
      try {
        text = await res.text();
        console.log('[adminFetch] Response body (fallback):', text);
      } catch (e2) {
        console.error('[adminFetch] Error reading response body:', e2);
      }
    }

    if (!text) {
      // No body (e.g., 204) – treat 2xx as success, otherwise error
      if (res.ok) return { success: true } as ApiResponse<T>;
      return { success: false, error: `HTTP ${res.status}` } as ApiResponse<T>;
    }

    try {
      const json = JSON.parse(text);
      return json as ApiResponse<T>;
    } catch {
      // Fallback: non-JSON response
      if (res.ok) return { success: true } as ApiResponse<T>;
      return { success: false, error: text } as ApiResponse<T>;
    }
  } catch (error) {
    return formatResponse<T>(null as any, error, path);
  }
}

export const api: SupabaseApiClient = {
  auth: {
    login: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return formatResponse({
          user: data.user,
          session: data.session,
        }, error);
      } catch (error) {
        return formatResponse(null, error);
      }
    },
    logout: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        return formatResponse({ message: "Logged out successfully" }, error);
      } catch (error) {
        return formatResponse(null, error);
      }
    },
    getCurrentUser: async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error && (isAuthSessionMissing(error) || isNetworkError(error))) {
          console.warn('[auth.getCurrentUser] treating missing session/network as unauthenticated');
          return formatResponse(null, null, 'auth.getCurrentUser');
        }
        return formatResponse(user, error, 'auth.getCurrentUser');
      } catch (error) {
        if (isNetworkError(error)) {
          console.warn('[auth.getCurrentUser] network error, treating as unauthenticated');
          return formatResponse(null, null, 'auth.getCurrentUser');
        }
        return formatResponse(null, error);
      }
    },
    signup: async (email: string, password: string, metadata?: any) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata },
        });
        return formatResponse({
          user: data.user,
          session: data.session,
        }, error);
      } catch (error) {
        return formatResponse(null, error);
      }
    },
    verify: async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error && (isAuthSessionMissing(error) || isNetworkError(error))) {
          console.warn('[auth.verify] treating missing session/network as unauthenticated');
          return formatResponse(null, null, 'auth.verify');
        }
        return formatResponse(data, error, 'auth.verify');
      } catch (error) {
        if (isNetworkError(error)) {
          console.warn('[auth.verify] network error, treating as unauthenticated');
          return formatResponse(null, null, 'auth.verify');
        }
        return formatResponse(null, error);
      }
    }
  },
  users: {
    getAll: async () => {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (error && (error as any).code === 'PGRST116') {
          console.warn('[users.getAll] Table missing, returning empty list');
          return formatResponse([] as any, null, 'users.getAll');
        }
        if (error && isNetworkError(error)) {
          console.warn('[users.getAll] Network error, returning empty list');
          return formatResponse([] as any, null, 'users.getAll');
        }
        return formatResponse(data, error, 'users.getAll');
      } catch (error) {
        return formatResponse(null, error, 'users.getAll');
      }
    }
  },
  images: {
    upload: async (file: File, entityType: string, entityId: number, altText?: string) => {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('images')
          .upload(`${entityType}/${entityId}/${fileName}`, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(`${entityType}/${entityId}/${fileName}`);

        return formatResponse(publicUrl);
      } catch (error) {
        return formatResponse(null, error);
      }
    },
    uploadMultiple: async (files: File[], entityType: string, entityId: number, altTexts?: string[]) => {
      try {
        const uploads = files.map(file => api.images.upload(file, entityType, entityId));
        const results = await Promise.all(uploads);
        const urls = results.map(result => result.data).filter(Boolean) as string[];
        return formatResponse(urls);
      } catch (error) {
        return formatResponse(null, error);
      }
    }
  },
  blog: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      category?: string;
      status?: string;
    }) => {
      try {
        let query = supabase.from('blog_posts').select('*');

        if (params?.category) query = query.eq('category', params.category);
        if (params?.status) query = query.eq('status', params.status);
        if (params?.limit) {
          const offset = ((params?.page || 1) - 1) * params.limit;
          query = query.range(offset, offset + params.limit - 1);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error && (error as any).code === 'PGRST116') {
          console.warn('[blog.getAll] Table missing, returning empty list');
          return formatResponse([] as any, null, 'blog.getAll');
        }
        if (error && isNetworkError(error)) {
          console.warn('[blog.getAll] Network error, returning empty list');
          return formatResponse([] as any, null, 'blog.getAll');
        }
        return formatResponse(data, error, 'blog.getAll');
      } catch (error) {
        return formatResponse(null, error, 'blog.getAll');
      }
    },
    getBySlug: async (slug: string) => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle();
        return formatResponse(data, error);
      } catch (error) {
        return formatResponse(null, error);
      }
    },
    listAll: async () => {
      try {
        const { data, error } = await supabase.from('blog_posts').select('*');
        return formatResponse(data, error);
      } catch (error) {
        return formatResponse(null, error);
      }
    },
    create: async (data) => {
      try {
        return await adminFetch('/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (error) {
        return formatResponse(null, error, 'blog.create');
      }
    },
    update: async (id, data) => {
      try {
        return await adminFetch(`/api/admin/blog/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (error) {
        return formatResponse(null, error, 'blog.update');
      }
    },
    delete: async (id) => {
      try {
        return await adminFetch(`/api/admin/blog/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        return formatResponse(null, error, 'blog.delete');
      }
    },
    getComments: async (postId) => {
      try {
        const { data, error } = await supabase
          .from('blog_comments')
          .select('*')
          .eq('post_id', postId);
        if (error && (error as any).code === 'PGRST116') {
          console.warn('[blog.getComments] Table missing, returning empty list');
          return formatResponse([] as any, null, 'blog.getComments');
        }
        return formatResponse(data, error, 'blog.getComments');
      } catch (error) {
        return formatResponse(null, error, 'blog.getComments');
      }
    },
    createComment: async (data) => {
      try {
        const { data: comment, error } = await supabase
          .from('blog_comments')
          .insert([data])
          .select()
          .maybeSingle();
        if (error && (error as any).code === 'PGRST116') {
          return formatResponse(null, { message: 'Comments feature not configured: table blog_comments missing' }, 'blog.createComment');
        }
        return formatResponse(comment, error, 'blog.createComment');
      } catch (error) {
        return formatResponse(null, error, 'blog.createComment');
      }
    },
    approveComment: async (commentId) => {
      try {
        const { data, error } = await supabase
          .from('blog_comments')
          .update({ status: 'approved' })
          .eq('id', commentId)
          .select()
          .maybeSingle();
        if (error && (error as any).code === 'PGRST116') {
          return formatResponse(null, { message: 'Comments feature not configured: table blog_comments missing' }, 'blog.approveComment');
        }
        return formatResponse(data, error, 'blog.approveComment');
      } catch (error) {
        return formatResponse(null, error, 'blog.approveComment');
      }
    },
    deleteComment: async (commentId) => {
      try {
        const { error } = await supabase
          .from('blog_comments')
          .delete()
          .eq('id', commentId);
        if (error && (error as any).code === 'PGRST116') {
          return formatResponse(null, { message: 'Comments feature not configured: table blog_comments missing' }, 'blog.deleteComment');
        }
        return formatResponse({}, error, 'blog.deleteComment');
      } catch (error) {
        return formatResponse(null, error, 'blog.deleteComment');
      }
    },
    getCategories: async () => {
      try {
        const { data, error } = await supabase
          .from('blog_categories')
          .select('*');
        if (error && (error as any).code === 'PGRST116') {
          console.warn('[blog.getCategories] Table missing, returning empty list');
          return formatResponse([] as any, null, 'blog.getCategories');
        }
        return formatResponse(data, error, 'blog.getCategories');
      } catch (error) {
        return formatResponse(null, error, 'blog.getCategories');
      }
    },
    createCategory: async (data) => {
      try {
        const { data: category, error } = await supabase
          .from('blog_categories')
          .insert([data])
          .select()
          .maybeSingle();
        return formatResponse(category, error);
      } catch (error) {
        return formatResponse(null, error);
      }
    },
    updateCategory: async (id, data) => {
      try {
        const { data: category, error } = await supabase
          .from('blog_categories')
          .update(data)
          .eq('id', id)
          .select()
          .maybeSingle();
        return formatResponse(category, error);
      } catch (error) {
        return formatResponse(null, error);
      }
    },
    deleteCategory: async (id) => {
      try {
        const { error } = await supabase
          .from('blog_categories')
          .delete()
          .eq('id', id);
        return formatResponse({}, error);
      } catch (error) {
        return formatResponse(null, error);
      }
    }
  },
  products: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      active?: boolean;
    }) => {
      try {
        console.log('[Products API] getAll called with params:', params);

        let query = supabase.from('products').select('*');

        if (params?.active !== undefined) query = query.eq('is_active', params.active);
        if (params?.category) query = query.eq('category', params.category);
        if (params?.search) {
          query = query.or(
            `name.ilike.%${params.search}%,description.ilike.%${params.search}%`
          );
        }
        if (params?.limit) {
          const offset = ((params?.page || 1) - 1) * params.limit;
          query = query.range(offset, offset + params.limit - 1);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error && (error as any).code === 'PGRST116') {
          console.warn('[products.getAll] Table missing, returning empty list');
          return formatResponse([] as any, null, 'products.getAll');
        }
        if (error && isNetworkError(error)) {
          console.warn('[products.getAll] Network error, returning empty list');
          return formatResponse([] as any, null, 'products.getAll');
        }
        return formatResponse(data, error, 'products.getAll');
      } catch (error) {
        console.error('[Products API] Error in getAll:', error);
        return formatResponse(null, error, 'products.getAll');
      }
    },
    getFeatured: async (limit?: number) => {
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (limit) query = query.limit(limit);

        const { data, error } = await query;
        if (error && isNetworkError(error)) {
          console.warn('[products.getFeatured] Network error, using empty list');
          return formatResponse([] as any, null, 'products.getFeatured');
        }
        return formatResponse(data, error, 'products.getFeatured');
      } catch (error) {
        if (isNetworkError(error)) {
          console.warn('[products.getFeatured] Network exception, using empty list');
          return formatResponse([] as any, null, 'products.getFeatured');
        }
        return formatResponse(null, error, 'products.getFeatured');
      }
    },
    getById: async (id: number) => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        return formatResponse(data, error);
      } catch (error) {
        return formatResponse(null, error);
      }
    },
    create: async (data) => {
      try {
        return await adminFetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (error) {
        return formatResponse(null, error, 'products.create');
      }
    },
    update: async (id, data) => {
      try {
        return await adminFetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (error) {
        return formatResponse(null, error, 'products.update');
      }
    },
    delete: async (id) => {
      try {
        return await adminFetch(`/api/admin/products/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        return formatResponse(null, error, 'products.delete');
      }
    },
    subscribeToStock: async (productId: number, email: string) => {
      try {
        const { data, error } = await supabase
          .from('stock_alerts')
          .insert([{ product_id: productId, email }])
          .select()
          .maybeSingle();
        return formatResponse(data, error);
      } catch (error) {
        return formatResponse(null, error);
      }
    }
  },
  testimonials: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      activeOnly?: boolean;
    }) => {
      try {
        let query = supabase.from('testimonials').select('*');

        if (params?.activeOnly !== undefined) query = query.eq('is_active', params.activeOnly);
        if (params?.limit) {
          const offset = ((params?.page || 1) - 1) * params.limit;
          query = query.range(offset, offset + params.limit - 1);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error && (error as any).code === 'PGRST116') {
          console.warn('[testimonials.getAll] Table missing, returning empty list');
          return formatResponse([] as any, null, 'testimonials.getAll');
        }
        if (error && isNetworkError(error)) {
          console.warn('[testimonials.getAll] Network error, returning empty list');
          return formatResponse([] as any, null, 'testimonials.getAll');
        }
        return formatResponse(data, error, 'testimonials.getAll');
      } catch (error) {
        return formatResponse(null, error, 'testimonials.getAll');
      }
    },
    getFeatured: async (limit?: number) => {
      try {
        let query = supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false });

        if (limit) query = query.limit(limit);

        const { data, error } = await query;
        if (error && isNetworkError(error)) {
          console.warn('[testimonials.getFeatured] Network error, using empty list');
          return formatResponse([] as any, null, 'testimonials.getFeatured');
        }
        return formatResponse(data, error, 'testimonials.getFeatured');
      } catch (error) {
        if (isNetworkError(error)) {
          console.warn('[testimonials.getFeatured] Network exception, using empty list');
          return formatResponse([] as any, null, 'testimonials.getFeatured');
        }
        return formatResponse(null, error, 'testimonials.getFeatured');
      }
    },
    getById: async (id: number) => {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        return formatResponse(data, error, 'testimonials.getById');
      } catch (error) {
        return formatResponse(null, error, 'testimonials.getById');
      }
    },
    create: async (data) => {
      try {
        return await adminFetch('/api/admin/testimonials', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (error) {
        return formatResponse(null, error, 'testimonials.create');
      }
    },
    update: async (id, data) => {
      try {
        return await adminFetch(`/api/admin/testimonials/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (error) {
        return formatResponse(null, error, 'testimonials.update');
      }
    },
    delete: async (id) => {
      try {
        return await adminFetch(`/api/admin/testimonials/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        return formatResponse(null, error, 'testimonials.delete');
      }
    }
  },
  services: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      active?: boolean;
      category?: string;
    }) => {
      try {
        console.log('[Services API] getAll called with params:', params);

        let query = supabase.from('services').select('*');

        if (params?.active !== undefined) query = query.eq('is_active', params.active);
        if (params?.category) query = query.eq('category', params.category);
        if (params?.limit) {
          const offset = ((params?.page || 1) - 1) * params.limit;
          query = query.range(offset, offset + params.limit - 1);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error && (error as any).code === 'PGRST116') {
          console.warn('[services.getAll] Table missing, returning empty list');
          return formatResponse([] as any, null, 'services.getAll');
        }
        if (error && isNetworkError(error)) {
          console.warn('[services.getAll] Network error, returning empty list');
          return formatResponse([] as any, null, 'services.getAll');
        }
        return formatResponse(data, error, 'services.getAll');
      } catch (error) {
        console.error('[Services API] Error in getAll:', error);
        return formatResponse(null, error, 'services.getAll');
      }
    },
    getFeatured: async (limit?: number) => {
      try {
        let query = supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (limit) query = query.limit(limit);

        const { data, error } = await query;
        if (error && isNetworkError(error)) {
          console.warn('[services.getFeatured] Network error, using empty list');
          return formatResponse([] as any, null, 'services.getFeatured');
        }
        return formatResponse(data, error, 'services.getFeatured');
      } catch (error) {
        if (isNetworkError(error)) {
          console.warn('[services.getFeatured] Network exception, using empty list');
          return formatResponse([] as any, null, 'services.getFeatured');
        }
        return formatResponse(null, error, 'services.getFeatured');
      }
    },
    getById: async (id: number) => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        return formatResponse(data, error, 'services.getById');
      } catch (error) {
        return formatResponse(null, error, 'services.getById');
      }
    },
    create: async (data) => {
      try {
        return await adminFetch('/api/admin/services', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (error) {
        return formatResponse(null, error, 'services.create');
      }
    },
    update: async (id, data) => {
      try {
        console.log('[API] Updating service:', { id, data });
        
        // Get current auth token
        const token = await getBearerToken();
        if (!token) {
          console.error('[API] No auth token available for service update');
          return formatResponse(null, 'No authentication token available', 'services.update');
        }

        // Log request details
        const url = `${window.location.origin}/api/admin/services/${id}`;
        console.log('[API] Making request to:', url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? 'Present' : 'Missing'
          },
          data
        });

        const response = await adminFetch(`/api/admin/services/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        console.log('[API] Update response:', response);

        // If we got a 404, check if the service exists first
        if (!response.success && response.error === 'HTTP 404') {
          const checkResult = await supabase
            .from('services')
            .select('id')
            .eq('id', id)
            .maybeSingle();
            
          if (checkResult.error) {
            console.error('[API] Error checking service existence:', checkResult.error);
          } else if (!checkResult.data) {
            console.error('[API] Service does not exist in database:', id);
          } else {
            console.error('[API] Service exists but endpoint returned 404:', {
              id,
              serviceData: checkResult.data
            });
          }
        }

        return response;
      } catch (error) {
        console.error('[API] Update error:', error);
        return formatResponse(null, error, 'services.update');
      }
    },
    delete: async (id) => {
      try {
        return await adminFetch(`/api/admin/services/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        return formatResponse(null, error, 'services.delete');
      }
    }
  },
  company: {
    getStats: async () => {
      try {
        // Get counts from different tables
        const [
          { count: productsCount },
          { count: servicesCount },
          { count: quotesCount },
          { count: testimonialsCount }
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('services').select('*', { count: 'exact', head: true }),
          supabase.from('quotes').select('*', { count: 'exact', head: true }),
          supabase.from('testimonials').select('*', { count: 'exact', head: true })
        ]);

        const stats = {
          totalProducts: productsCount || 0,
          totalServices: servicesCount || 0,
          totalQuotes: quotesCount || 0,
          totalTestimonials: testimonialsCount || 0,
          yearsInBusiness: new Date().getFullYear() - 2010,
          satisfactionRate: 98,
          projectsCompleted: 500,
        };

        return formatResponse(stats, null, 'company.getStats');
      } catch (error) {
        console.error('[Company API] Error in getStats:', error);
        return formatResponse(null, error, 'company.getStats');
      }
    }
  },
  contact: {
    create: async (data: Partial<ContactMessage>) => {
      try {
        console.log('[contact.create] submitting:', data);
        // Use server route (service role) to avoid RLS and also send email
        const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
        const tryEndpoints = [
          `${baseUrl}/api/contact`,
          `${baseUrl}/api/contact/create`,
          `${baseUrl}/api/contact/send`
        ];

        let finalRes: Response | null = null;
        let finalText = '';
        let finalJson: any = null;

        for (const endpoint of tryEndpoints) {
          try {
            const r = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });

            // If 404, try next endpoint
            if (r.status === 404) {
              console.warn('[contact.create] Endpoint not found, trying next:', endpoint);
              continue;
            }

            // Read response body safely — only if not already consumed
            let text = '';
            try {
              if ((r as any).bodyUsed) {
                text = '[body already used]';
              } else {
                try { text = await r.clone().text(); }
                catch (e) { text = await r.text(); }
              }
            } catch (e) {
              console.error('[contact.create] Failed to read response body:', e);
            }

            let json: any = null;
            try { json = text && text !== '[body already used]' ? JSON.parse(text) : null; } catch {}

            console.log('[contact.create] response from', endpoint, { status: r.status, ok: r.ok, body: text });

            finalRes = r;
            finalText = text;
            finalJson = json;

            // Stop trying if we got a non-404 response
            break;
          } catch (err) {
            console.warn('[contact.create] Error calling endpoint, trying next:', err);
            continue;
          }
        }

        if (!finalRes) {
          throw new Error('No contact endpoint reachable');
        }

        if (!finalRes.ok || !finalJson?.success) {
          // If endpoint returned an error, still attempt to call a send-only route as a best-effort
          try {
            const sendEndpoint = `${baseUrl}/api/contact/send`;
            await fetch(sendEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: data.name,
                email: data.email,
                phone: (data as any)?.phone,
                subject: (data as any)?.subject,
                message: (data as any)?.message,
              })
            });
          } catch (e) {
            console.warn('[contact.create] Best-effort send failed:', e);
          }

          throw new Error((finalJson && (finalJson.error || finalJson.message)) || `HTTP ${finalRes.status}`);
        }

        return formatResponse(finalJson.data || null, null, 'contact.create');
      } catch (error) {
        return formatResponse(null, error, 'contact.create');
      }
    },
    getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
      try {
        let query = supabase.from('contact_messages').select('*');

        if (params?.status) query = query.eq('status', params.status);
        if (params?.limit) {
          const offset = ((params?.page || 1) - 1) * params.limit;
          query = query.range(offset, offset + params.limit - 1);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error && (error as any).code === 'PGRST116') {
          console.warn('[contact.getAll] Table missing, returning empty list');
          return formatResponse([] as any, null, 'contact.getAll');
        }
        if (error && isNetworkError(error)) {
          console.warn('[contact.getAll] Network error, returning empty list');
          return formatResponse([] as any, null, 'contact.getAll');
        }
        return formatResponse(data, error, 'contact.getAll');
      } catch (error) {
        return formatResponse(null, error, 'contact.getAll');
      }
    },
    update: async (id: number, data: Partial<ContactMessage>) => {
      try {
        return await adminFetch(`/api/admin/contacts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (error) {
        return formatResponse(null, error, 'contact.update');
      }
    },
    delete: async (id: number) => {
      try {
        return await adminFetch(`/api/admin/contacts/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        return formatResponse(null, error, 'contact.delete');
      }
    }
  },
  analytics: {
    getGoogleAnalytics: async () => {
      try {
        const response = await ga4Client.getGoogleAnalytics();
        // Return empty analytics data if server fails
        if (!response.success) {
          console.warn('[Analytics] GA4 data fetch failed, using empty data');
          return formatResponse({
            pageViews: 0,
            sessions: 0,
            users: 0,
            newUsers: 0,
            bounceRate: 0,
            avgSessionDuration: 0
          }, null, 'analytics.getGoogleAnalytics');
        }
        return response;
      } catch (error) {
        console.warn('[Analytics] GA4 error:', error);
        return formatResponse({
          pageViews: 0,
          sessions: 0,
          users: 0,
          newUsers: 0,
          bounceRate: 0,
          avgSessionDuration: 0
        }, null, 'analytics.getGoogleAnalytics');
      }
    },
    getRealTimeData: async () => {
      try {
        const response = await ga4Client.getRealTimeData();
        // Return empty realtime data if server fails
        if (!response.success) {
          console.warn('[Analytics] Realtime data fetch failed, using empty data');
          return formatResponse({
            activeUsers: 0,
            pageViews: 0,
            topPages: []
          }, null, 'analytics.getRealTimeData');
        }
        return response;
      } catch (error) {
        console.warn('[Analytics] Realtime error:', error);
        return formatResponse({
          activeUsers: 0,
          pageViews: 0,
          topPages: []
        }, null, 'analytics.getRealTimeData');
      }
    },
    getConversionData: async () => {
      try {
        const response = await ga4Client.getConversionData();
        // Return empty conversion data if server fails
        if (!response.success) {
          console.warn('[Analytics] Conversion data fetch failed, using empty data');
          return formatResponse({
            conversions: 0,
            conversionRate: 0,
            goals: []
          }, null, 'analytics.getConversionData');
        }
        return response;
      } catch (error) {
        console.warn('[Analytics] Conversion error:', error);
        return formatResponse({
          conversions: 0,
          conversionRate: 0,
          goals: []
        }, null, 'analytics.getConversionData');
      }
    },
    refresh: async () => {
      try {
        const [analyticsRes, realTimeRes, conversionRes] = await Promise.all([
          api.analytics.getGoogleAnalytics(),
          api.analytics.getRealTimeData(),
          api.analytics.getConversionData()
        ]);

        return formatResponse({
          analytics: analyticsRes.data,
          realTime: realTimeRes.data,
          conversions: conversionRes.data
        });
      } catch (error) {
        // Return empty data for all analytics if refresh fails
        console.warn('[Analytics] Refresh error:', error);
        return formatResponse({
          analytics: {
            pageViews: 0,
            sessions: 0,
            users: 0,
            newUsers: 0,
            bounceRate: 0,
            avgSessionDuration: 0
          },
          realTime: {
            activeUsers: 0,
            pageViews: 0,
            topPages: []
          },
          conversions: {
            conversions: 0,
            conversionRate: 0,
            goals: []
          }
        }, null, 'analytics.refresh');
      }
    }
  },
  quotes: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
    }) => {
      try {
        let query = supabase.from('quotes').select('*');

        if (params?.status) query = query.eq('status', params.status);
        if (params?.limit) {
          const offset = ((params?.page || 1) - 1) * params.limit;
          query = query.range(offset, offset + params.limit - 1);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error && (error as any).code === 'PGRST116') {
          console.warn('[quotes.getAll] Table missing, returning empty list');
          return formatResponse([] as any, null, 'quotes.getAll');
        }
        if (error && isNetworkError(error)) {
          console.warn('[quotes.getAll] Network error, returning empty list');
          return formatResponse([] as any, null, 'quotes.getAll');
        }
        return formatResponse(data, error, 'quotes.getAll');
      } catch (error) {
        return formatResponse(null, error, 'quotes.getAll');
      }
    },
    getById: async (id: number) => {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        return formatResponse(data, error, 'quotes.getById');
      } catch (error) {
        return formatResponse(null, error, 'quotes.getById');
      }
    },
    create: async (data) => {
      try {
        const { data: quote, error } = await supabase
          .from('quotes')
          .insert([data])
          .select()
          .maybeSingle();
        // Fire and forget email notification
        try {
          const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
          const endpoints = [`${baseUrl}/api/quotes`, `${baseUrl}/api/quotes/send`];
          for (const ep of endpoints) {
            try {
              const r = await fetch(ep, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (r.ok) break;
            } catch (e) {
              // try next
              continue;
            }
          }
        } catch {}
        return formatResponse(quote, error, 'quotes.create');
      } catch (error) {
        return formatResponse(null, error, 'quotes.create');
      }
    },
    update: async (id, data) => {
      try {
        return await adminFetch(`/api/admin/quotes/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (error) {
        return formatResponse(null, error, 'quotes.update');
      }
    },
    delete: async (id) => {
      try {
        return await adminFetch(`/api/admin/quotes/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        return formatResponse(null, error, 'quotes.delete');
      }
    }
  }
};
