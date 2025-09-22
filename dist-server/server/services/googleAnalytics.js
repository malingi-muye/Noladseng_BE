import { BetaAnalyticsDataClient } from '@google-analytics/data';
class GoogleAnalyticsService {
    constructor() {
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "propertyId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.propertyId = process.env.GA4_PROPERTY_ID;
        this.client = new BetaAnalyticsDataClient({
            credentials: {
                client_email: process.env.GA4_CLIENT_EMAIL,
                private_key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
        });
    }
    async getRealtimeUsers() {
        const [response] = await this.client.runRealtimeReport({
            property: `properties/${this.propertyId}`,
            dimensions: [{ name: 'country' }],
            metrics: [{ name: 'activeUsers' }],
        });
        return response;
    }
    async getBasicMetrics(startDate, endDate) {
        const [response] = await this.client.runReport({
            property: `properties/${this.propertyId}`,
            dateRanges: [{ startDate, endDate }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' },
                { name: 'averageSessionDuration' },
                { name: 'bounceRate' },
            ],
        });
        return response;
    }
    async getTrafficSource(startDate, endDate) {
        const [response] = await this.client.runReport({
            property: `properties/${this.propertyId}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'sessionSource' }],
            metrics: [{ name: 'sessions' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: 5,
        });
        return response;
    }
    async getDailyUsers(days = 7) {
        const [response] = await this.client.runReport({
            property: `properties/${this.propertyId}`,
            dateRanges: [{
                    startDate: `${days}daysAgo`,
                    endDate: 'today',
                }],
            dimensions: [{ name: 'date' }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
            ],
            orderBys: [{ dimension: { dimensionName: 'date' } }],
        });
        return response;
    }
}
export const googleAnalytics = new GoogleAnalyticsService();
