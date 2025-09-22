# Vercel Serverless Migration Guide

This guide documents the migration from Express.js server to Vercel serverless functions.

## ✅ What's Been Migrated

### API Endpoints
- ✅ `/api/contact` - Contact form submissions
- ✅ `/api/quotes` - Quote request submissions  
- ✅ `/api/analytics/*` - Analytics data endpoints
- ✅ `/api/admin/products` - Product CRUD operations
- ✅ `/api/admin/services` - Service CRUD operations
- ✅ `/api/admin/testimonials` - Testimonial CRUD operations
- ✅ `/api/admin/blog` - Blog post CRUD operations
- ✅ `/api/admin/contacts` - Contact message management
- ✅ `/api/admin/quotes` - Quote request management
- ✅ `/api/health` - Health check endpoint

### Services
- ✅ Email service (nodemailer) - Works in serverless
- ✅ Supabase admin client - Works in serverless
- ✅ Google Analytics integration - Works in serverless
- ✅ Admin authentication - Works in serverless

## ⚠️ WebSocket Limitations

**WebSockets DO NOT work on Vercel serverless functions.** This affects:

### Real-time Updates
- Product updates (`products:update`)
- Service updates (`services:update`) 
- Testimonial updates (`testimonials:update`)
- Blog updates (`blog:update`)

### Alternative Solutions

#### Option 1: Polling (Recommended)
Replace WebSocket updates with periodic polling:

```typescript
// In your React components
useEffect(() => {
  const interval = setInterval(() => {
    // Refetch data every 30 seconds
    refetchProducts();
    refetchServices();
  }, 30000);
  
  return () => clearInterval(interval);
}, []);
```

#### Option 2: Supabase Realtime
Use Supabase's built-in realtime subscriptions:

```typescript
// Subscribe to table changes
const subscription = supabase
  .channel('products')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'products' },
    (payload) => {
      // Handle real-time updates
      refetchProducts();
    }
  )
  .subscribe();
```

#### Option 3: Server-Sent Events (SSE)
Implement SSE for one-way real-time updates:

```typescript
// Create /api/events.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send periodic updates
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
  }, 30000);

  req.on('close', () => clearInterval(interval));
}
```

## 🔧 Environment Variables

Ensure these environment variables are set in your Vercel dashboard:

### Required
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE=your_service_role_key
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=your_from_email
```

### Optional
```
CONTACT_RECIPIENT=contact@yourdomain.com
QUOTES_RECIPIENT=quotes@yourdomain.com
GA4_PROPERTY_ID=your_ga4_property_id
GA4_CLIENT_EMAIL=your_service_account_email
GA4_PRIVATE_KEY=your_private_key
GA4_CONVERSION_EVENT=generate_lead
```

## 🚀 Deployment

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy
```bash
vercel --prod
```

### 3. Set Environment Variables
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE
# ... add all required variables
```

## 📝 API Changes

### URL Structure
- **Before**: `http://localhost:8000/api/admin/products`
- **After**: `https://your-app.vercel.app/api/admin/products`

### Authentication
Admin endpoints still require Bearer token authentication:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Error Handling
All endpoints return consistent JSON responses:
```typescript
{
  success: boolean,
  data?: any,
  error?: string,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```

## 🔍 Testing

### Local Development
```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev
```

### Production Testing
```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Test contact form
curl -X POST https://your-app.vercel.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Hello"}'
```

## 📊 Performance Considerations

### Cold Starts
- First request to each function may take 1-2 seconds
- Subsequent requests are much faster
- Consider implementing warming strategies for critical endpoints

### Timeouts
- Maximum execution time: 30 seconds (configured in vercel.json)
- For longer operations, consider background jobs or database triggers

### Memory Limits
- 1024MB memory limit per function
- Monitor memory usage for image processing or large data operations

## 🛠️ Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure all imports use relative paths
   - Check that shared modules are accessible

2. **Environment Variables**
   - Verify all required env vars are set in Vercel dashboard
   - Check variable names match exactly (case-sensitive)

3. **CORS Issues**
   - All functions include CORS headers
   - Update frontend API base URL to Vercel domain

4. **Database Connections**
   - Supabase client handles connection pooling automatically
   - No manual connection management needed

### Debugging
```bash
# View function logs
vercel logs

# View specific function logs
vercel logs --function=contact
```

## 🔄 Migration Checklist

- [ ] Update frontend API base URL to Vercel domain
- [ ] Remove WebSocket dependencies from frontend
- [ ] Implement polling or Supabase realtime for updates
- [ ] Test all admin endpoints with authentication
- [ ] Verify email functionality works
- [ ] Test analytics endpoints
- [ ] Update deployment scripts
- [ ] Monitor performance and costs

## 💰 Cost Considerations

### Vercel Pricing
- **Hobby**: 100GB bandwidth, 100GB-hours execution time
- **Pro**: 1TB bandwidth, 1000GB-hours execution time
- **Enterprise**: Custom limits

### Optimization Tips
- Implement caching where possible
- Use database queries efficiently
- Consider CDN for static assets
- Monitor usage in Vercel dashboard

## 📞 Support

For issues with the migration:
1. Check Vercel function logs
2. Verify environment variables
3. Test endpoints individually
4. Review this guide for common solutions
