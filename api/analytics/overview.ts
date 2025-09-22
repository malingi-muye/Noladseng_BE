import { VercelRequest, VercelResponse } from '@vercel/node';
import { ga4Analytics } from '../../server/services/ga4Analytics';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Prevent any caching on analytics endpoints
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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
    return res.json({
      success: true,
      error: message,
      data: fallbackData || FALLBACK_DATA,
    });
  };

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
