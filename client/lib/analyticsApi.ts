interface GA4Metrics {
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
  averageSessionDuration: number;
  bounceRate: number;
}

interface TimeseriesData {
  labels: string[];
  users: number[];
  sessions: number[];
}

interface SourceData {
  labels: string[];
  sessions: number[];
}

export const analyticsApi = {
  async getMetrics(): Promise<GA4Metrics> {
    const response = await fetch('/api/analytics/metrics');
    if (!response.ok) {
      throw new Error('Failed to fetch analytics metrics');
    }
    return response.json();
  },
  
  async getTimeseries(): Promise<TimeseriesData> {
    const response = await fetch('/api/analytics/timeseries');
    if (!response.ok) {
      throw new Error('Failed to fetch timeseries data');
    }
    return response.json();
  },
  
  async getSources(): Promise<SourceData> {
    const response = await fetch('/api/analytics/sources');
    if (!response.ok) {
      throw new Error('Failed to fetch traffic sources');
    }
    return response.json();
  },
};