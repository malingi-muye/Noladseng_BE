import { VercelRequest, VercelResponse } from '@vercel/node';
import { ga4Analytics } from '../../server/services/ga4Analytics';

function noCache(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

export async function handleAnalytics(req: VercelRequest, res: VercelResponse) {
  noCache(res);
  const path = req.url || '';
  if (!ga4Analytics.isConfigured) {
    return res.json({ success: true, error: 'GA4 not configured', data: { pageViews: 0, sessions: 0, users: 0 } });
  }
  try {
    if (path.includes('/analytics/overview')) {
      const [overview, topPages, trafficSources, devices] = await Promise.all([
        ga4Analytics.getBasicMetrics(),
        ga4Analytics.getTopPages(),
        ga4Analytics.getTrafficSources(),
        ga4Analytics.getDeviceBreakdown(),
      ]);
      const data = {
        pageViews: overview?.screenPageViews || 0,
        sessions: overview?.sessions || 0,
        users: overview?.activeUsers || 0,
        bounceRate: overview?.bounceRate || 0,
        avgSessionDuration: overview?.averageSessionDuration || 0,
        topPages: topPages || [],
        trafficSources: trafficSources || [],
        deviceBreakdown: devices || [],
      };
      return res.json({ success: true, error: null, data });
    }
    if (path.includes('/analytics/realtime')) {
      const data = await ga4Analytics.getTimeseriesData();
      const realtimeData = {
        activeUsers: data?.users?.[data.users.length - 1] || 0,
        pageViews: 0,
        topPages: [],
        currentPages: [],
        deviceBreakdown: [],
        countries: [],
      };
      return res.json({ success: true, error: null, data: realtimeData });
    }
    if (path.includes('/analytics/conversions')) {
      const eventName = process.env.GA4_CONVERSION_EVENT || 'generate_lead';
      const eventSummary = await ga4Analytics.getEventCountSummary(eventName);
      const conversionData = {
        totalConversions: eventSummary.count || 0,
        conversionRate: 0,
        revenue: 0,
        goalCompletions: [],
        lastUpdated: new Date().toISOString(),
      };
      return res.json({ success: true, error: null, data: conversionData });
    }
    return res.status(404).json({ success: false, error: 'Analytics endpoint not found' });
  } catch (error: any) {
    return res.json({ success: true, error: 'Analytics error', data: { pageViews: 0, sessions: 0, users: 0 } });
  }
}

