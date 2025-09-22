import { VercelRequest, VercelResponse } from '@vercel/node';
import { ga4Analytics } from '../../server/services/ga4Analytics.js';

// Prevent any caching on analytics endpoints
const setNoCacheHeaders = (res: VercelResponse) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
};

interface AnalyticsFallbackData {
  pageViews: number;
  sessions: number;
  users: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: any[];
  trafficSources: any[];
  deviceBreakdown: any[];
  activeUsers?: number;
  currentPages?: any[];
  countries?: any[];
  totalConversions?: number;
  conversionRate?: number;
  revenue?: number;
  goalCompletions?: any[];
  lastUpdated?: string;
}

const FALLBACK_DATA: AnalyticsFallbackData = {
  pageViews: 0,
  sessions: 0,
  users: 0,
  bounceRate: 0,
  avgSessionDuration: 0,
  topPages: [],
  trafficSources: [],
  deviceBreakdown: [],
  activeUsers: 0,
  currentPages: [],
  countries: [],
  totalConversions: 0,
  conversionRate: 0,
  revenue: 0,
  goalCompletions: [],
  lastUpdated: new Date().toISOString(),
};

const handleAnalyticsError = (
  res: VercelResponse,
  error: any,
  message: string,
  fallbackData: any = null,
) => {
  console.error(`Error in analytics route: ${message}`, error);

  // Always return 200 with fallback data so the UI remains functional
  return res.json({
    success: true,
    error: message,
    data: fallbackData || FALLBACK_DATA,
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  // Set no-cache headers
  setNoCacheHeaders(res);

  const path = req.query.path as string[] || [];
  const endpoint = path.join('/');

  try {
    switch (endpoint) {
      case 'overview':
        return await handleOverview(req, res);
      case 'realtime':
        return await handleRealtime(req, res);
      case 'conversions':
        return await handleConversions(req, res);
      default:
        return res.status(404).json({
          success: false,
          error: 'Analytics endpoint not found'
        });
    }
  } catch (error) {
    console.error('Analytics handler error:', error);
    return handleAnalyticsError(res, error, 'Internal server error');
  }
}

async function handleOverview(req: VercelRequest, res: VercelResponse) {
  if (!ga4Analytics.isConfigured) {
    return handleAnalyticsError(res, null, "GA4 not configured", FALLBACK_DATA);
  }

  try {
    const [overview, topPages, trafficSources, devices] = await Promise.all([
      ga4Analytics.getBasicMetrics(),
      ga4Analytics.getTopPages(),
      ga4Analytics.getTrafficSources(),
      ga4Analytics.getDeviceBreakdown(),
    ]);
    
    if (!overview) {
      return handleAnalyticsError(
        res,
        null,
        "No analytics data available",
        FALLBACK_DATA,
      );
    }

    const data = {
      pageViews: overview.screenPageViews || 0,
      sessions: overview.sessions || 0,
      users: overview.activeUsers || 0,
      bounceRate: overview.bounceRate || 0,
      avgSessionDuration: overview.averageSessionDuration || 0,
      topPages: topPages || [],
      trafficSources: trafficSources || [],
      deviceBreakdown: devices || [],
    };

    return res.json({
      success: true,
      error: null,
      data,
    });
  } catch (error) {
    return handleAnalyticsError(
      res,
      error,
      "Failed to fetch analytics overview",
      FALLBACK_DATA,
    );
  }
}

async function handleRealtime(req: VercelRequest, res: VercelResponse) {
  if (!ga4Analytics.isConfigured) {
    return handleAnalyticsError(res, null, "GA4 not configured", FALLBACK_DATA);
  }

  try {
    const data = await ga4Analytics.getTimeseriesData();
    if (!data) {
      return handleAnalyticsError(
        res,
        null,
        "No realtime data available",
        FALLBACK_DATA,
      );
    }

    const realtimeData = {
      activeUsers: data.users?.[data.users.length - 1] || 0,
      pageViews: 0,
      topPages: [],
      currentPages: [],
      deviceBreakdown: [],
      countries: [],
    };

    return res.json({
      success: true,
      error: null,
      data: realtimeData,
    });
  } catch (error) {
    return handleAnalyticsError(
      res,
      error,
      "Failed to fetch realtime data",
      FALLBACK_DATA,
    );
  }
}

async function handleConversions(req: VercelRequest, res: VercelResponse) {
  if (!ga4Analytics.isConfigured) {
    return handleAnalyticsError(res, null, "GA4 not configured", FALLBACK_DATA);
  }

  try {
    const metrics = await ga4Analytics.getBasicMetrics();
    const eventName = process.env.GA4_CONVERSION_EVENT || "generate_lead";
    const eventSummary = await ga4Analytics.getEventCountSummary(eventName);
    
    if (!metrics) {
      return handleAnalyticsError(
        res,
        null,
        "No conversion data available",
        FALLBACK_DATA,
      );
    }

    const conversionData = {
      totalConversions: eventSummary.count || 0,
      conversionRate: 0,
      revenue: 0,
      goalCompletions: [],
      lastUpdated: new Date().toISOString(),
    };

    return res.json({
      success: true,
      error: null,
      data: conversionData,
    });
  } catch (error) {
    return handleAnalyticsError(
      res,
      error,
      "Failed to fetch conversion data",
      FALLBACK_DATA,
    );
  }
}
