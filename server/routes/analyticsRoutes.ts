import { Router } from "express";
import { ga4Analytics } from "../services/ga4Analytics";

const router = Router();

// Prevent any caching on analytics endpoints
router.use("/analytics", (req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

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
  res: any,
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

router.get("/analytics/overview", async (req, res) => {
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
});

router.get("/analytics/realtime", async (req, res) => {
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
});

router.get("/analytics/conversions", async (req, res) => {
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
});

export default router;
