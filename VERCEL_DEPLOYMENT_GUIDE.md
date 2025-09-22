# Vercel Serverless Deployment Guide

## Overview
Your Express backend has been successfully converted to Vercel serverless functions. Each route is now a separate serverless function that will scale automatically.

## What Was Converted

### API Endpoints
- ✅ `/api/health` - Health check endpoint
- ✅ `/api/contact` - Contact form submission
- ✅ `/api/quotes` - Quote request submission
- ✅ `/api/analytics/overview` - Analytics overview data
- ✅ `/api/analytics/realtime` - Real-time analytics data
- ✅ `/api/analytics/conversions` - Conversion analytics data

### Admin Endpoints (Protected)
- ✅ `/api/admin/products` - Product management (CRUD)
- ✅ `/api/admin/blog` - Blog post management (CRUD)
- ✅ `/api/admin/services` - Service management (CRUD)
- ✅ `/api/admin/testimonials` - Testimonial management (CRUD)
- ✅ `/api/admin/quotes` - Quote request management (CRUD)
- ✅ `/api/admin/contacts` - Contact message management (CRUD)

## Deployment Steps

### 1. Environment Variables
Make sure these environment variables are set in your Vercel dashboard:

**Required:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Optional (for email functionality):**
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `CONTACT_RECIPIENT`
- `QUOTES_RECIPIENT`

**Optional (for analytics):**
- `GA4_PROPERTY_ID`
- `GA4_PRIVATE_KEY`
- `GA4_CLIENT_EMAIL`

**Optional (for CORS):**
- `CORS_ORIGIN` (comma-separated list of allowed origins)

### 2. Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

#### Option B: Git Integration
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Vercel
3. Vercel will automatically deploy on every push

### 3. Configure Domain (Optional)
- Go to your Vercel dashboard
- Navigate to your project settings
- Add your custom domain under "Domains"

## Important Notes

### WebSocket Limitation
⚠️ **Important**: WebSocket connections are not supported in Vercel serverless functions. The real-time updates that were previously handled by Socket.IO will not work.

**Solutions:**
1. Use polling on the client side
2. Implement Server-Sent Events (SSE) - though limited
3. Use external services like Pusher or Supabase Realtime
4. See `WEBSOCKET_LIMITATION.md` for detailed alternatives

### Cold Starts
Serverless functions may experience cold starts (slower initial response). This is normal and expected behavior.

### Function Timeout
Functions have a maximum execution time of 30 seconds (as configured in vercel.json).

## Testing the Deployment

### 1. Health Check
```bash
curl https://your-domain.vercel.app/api/health
```

### 2. Contact Form
```bash
curl -X POST https://your-domain.vercel.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "Test message"
  }'
```

### 3. Admin Endpoint (requires authentication)
```bash
curl https://your-domain.vercel.app/api/admin/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## File Structure
```
api/
├── health.ts                 # Health check
├── contact.ts               # Contact form
├── quotes.ts                # Quote requests
├── analytics/
│   ├── overview.ts          # Analytics overview
│   ├── realtime.ts          # Real-time analytics
│   └── conversions.ts       # Conversion analytics
├── admin/
│   ├── auth.ts              # Admin authentication helpers
│   ├── products.ts          # Product management
│   ├── blog.ts              # Blog management
│   ├── services.ts          # Service management
│   ├── testimonials.ts      # Testimonial management
│   ├── quotes.ts            # Quote management
│   └── contacts.ts          # Contact management
└── index.ts                 # Catch-all handler
```

## Monitoring and Debugging

### Vercel Dashboard
- Monitor function executions
- View logs and errors
- Check performance metrics

### Environment Variables
- Verify all required environment variables are set
- Check that Supabase credentials are correct

### Database Connection
- Ensure Supabase is accessible from Vercel
- Check Row Level Security (RLS) policies

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGIN` environment variable
   - Ensure your frontend domain is included

2. **Database Connection Errors**
   - Verify Supabase credentials
   - Check RLS policies for admin operations

3. **Email Not Working**
   - Verify SMTP configuration
   - Check email service provider settings

4. **Authentication Errors**
   - Ensure admin tokens are valid
   - Check Supabase auth configuration

### Getting Help
- Check Vercel function logs in the dashboard
- Review environment variable configuration
- Test individual endpoints using curl or Postman
