# CORS Deployment Guide

## Issues Fixed

### 1. Import Path Issues
**Problem**: Serverless functions were failing due to incorrect import paths for the CORS utility.

**Solution**: Updated all import statements to use `.js` extension:
```typescript
// Before
import { applyCors, handlePreflight } from '../serverless/_cors';

// After  
import { applyCors, handlePreflight } from '../serverless/_cors.js';
```

### 2. Vercel Configuration Conflict
**Problem**: Using both `routes` and `headers` in `vercel.json` is not allowed.

**Solution**: Replaced `routes` with `rewrites`:
```json
{
  "rewrites": [
    {
      "source": "/api/contact",
      "destination": "/api/contact.ts"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [...]
    }
  ]
}
```

### 3. Function Invocation Failures
**Problem**: Functions were failing with `FUNCTION_INVOCATION_FAILED` due to import issues.

**Solution**: 
- Fixed all import paths
- Created simplified test endpoints without external dependencies
- Added comprehensive error handling

## Files Modified

### Core CORS Files
- `serverless/_cors.ts` - Enhanced CORS utility
- `vercel.json` - Fixed configuration conflicts

### API Endpoints (Fixed Import Paths)
- `api/contact.ts`
- `api/quotes.ts`
- `api/analytics/overview.ts`
- `api/analytics/realtime.ts`
- `api/analytics/conversions.ts`
- `api/admin/products.ts`
- `api/admin/services.ts`
- `api/admin/testimonials.ts`
- `api/admin/quotes.ts`
- `api/admin/contacts.ts`
- `api/cors-test.ts`

### New Test Endpoints
- `api/simple-cors-test.ts` - Basic CORS test without external imports
- `api/simple-contact.ts` - Simplified contact endpoint for testing

## Testing Strategy

### 1. Deploy and Test Simple Endpoints First

Test these endpoints in order:

1. **Simple CORS Test**: `GET https://noladseng-be.vercel.app/api/simple-cors-test`
2. **Simple Contact Test**: `POST https://noladseng-be.vercel.app/api/simple-contact`

### 2. Test Commands

#### Test Simple CORS Endpoint
```bash
curl -X GET https://noladseng-be.vercel.app/api/simple-cors-test \
  -H "Origin: https://noladseng.com" \
  -v
```

#### Test Simple Contact Endpoint
```bash
curl -X POST https://noladseng-be.vercel.app/api/simple-contact \
  -H "Origin: https://noladseng.com" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","message":"Test message"}' \
  -v
```

#### Test Preflight Request
```bash
curl -X OPTIONS https://noladseng-be.vercel.app/api/simple-contact \
  -H "Origin: https://noladseng.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

### 3. Browser Testing

Test from browser console:
```javascript
// Test simple CORS endpoint
fetch('https://noladseng-be.vercel.app/api/simple-cors-test', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Simple CORS Test:', data))
.catch(error => console.error('CORS Error:', error));

// Test simple contact endpoint
fetch('https://noladseng-be.vercel.app/api/simple-contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    message: 'Test message'
  })
})
.then(response => response.json())
.then(data => console.log('Simple Contact Test:', data))
.catch(error => console.error('Contact Error:', error));
```

## Deployment Steps

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables** in Vercel Dashboard:
   ```
   CORS_ORIGIN=https://noladseng.com,https://www.noladseng.com,https://noladseng-be.vercel.app
   ```

3. **Test Simple Endpoints** first to verify basic CORS functionality

4. **Test Original Endpoints** once simple endpoints work

5. **Monitor Vercel Function Logs** for any remaining issues

## Troubleshooting

### If Simple Endpoints Work But Original Don't
- Check Vercel function logs for import errors
- Verify all dependencies are properly installed
- Check if Supabase configuration is correct

### If All Endpoints Fail
- Check Vercel deployment logs
- Verify `vercel.json` syntax is correct
- Check if environment variables are set

### If CORS Headers Are Missing
- Check if Vercel headers configuration is working
- Verify function is returning proper headers
- Test with different browsers/devtools

## Next Steps

1. Deploy the updated code
2. Test simple endpoints first
3. If successful, test original endpoints
4. Update frontend to use working endpoints
5. Remove test endpoints once everything works

## Environment Variables Required

Make sure these are set in Vercel:
- `CORS_ORIGIN` - Comma-separated list of allowed origins
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE` - Service role key for admin operations
- `SMTP_*` - Email configuration variables
