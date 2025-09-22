import { VercelRequest, VercelResponse } from '@vercel/node';
import { ga4Analytics } from '../../server/services/ga4Analytics';
import { applyCors, handlePreflight } from '../../serverless/_cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  
  // Prevent any caching on analytics endpoints
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  if (handlePreflight(req, res)) return;

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
