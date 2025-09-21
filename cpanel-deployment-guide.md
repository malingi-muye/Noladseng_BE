# cPanel + Vercel Deployment Guide for Nolads Engineering Website

## Overview
This guide will help you deploy your React + Node.js application using:
- **Frontend**: Static files hosted on cPanel
- **Backend**: Serverless functions hosted on Vercel

## Prerequisites
- cPanel hosting account
- Vercel account (free tier available)
- Domain name configured

## Step 1: Deploy Frontend to cPanel

### 1.1 Build the Frontend
```bash
npm run build:client
```

### 1.2 Upload to cPanel
1. **Access cPanel File Manager**
2. **Navigate to `public_html` directory**
3. **Upload all contents from `dist` folder**:
   - `index.html`
   - `assets/` folder (contains all CSS, JS, images)
   - Any other static files

### 1.3 Configure .htaccess for SPA Routing
Create a `.htaccess` file in your `public_html` directory:

```apache
RewriteEngine On

# Handle Angular and React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Enable GZIP compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

## Step 2: Deploy Backend to Vercel

### 2.1 Prepare Backend for Vercel

Vercel works best with serverless functions. We need to convert your Express server to Vercel's API format.

#### 2.1.1 Create Vercel Configuration
Create `vercel.json` in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/server.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 2.1.2 Create Vercel API Handler
Create `api/index.ts` in your project root:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import contactRoutes from '../server/routes/contact';
import quotesEmailRoutes from '../server/routes/quotes-email';
import analyticsRoutes from '../server/routes/analyticsRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/contact", contactRoutes);
app.use("/api/quotes", quotesEmailRoutes);
app.use("/api", analyticsRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
```

### 2.2 Deploy to Vercel

#### Option A: Using Vercel CLI
1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

#### Option B: Using Vercel Dashboard
1. **Connect GitHub repository** to Vercel
2. **Set build settings:**
   - Build Command: `npm run build:server`
   - Output Directory: `dist-server`
   - Install Command: `npm install`

3. **Set environment variables** in Vercel dashboard:
   ```
   NODE_ENV=production
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE=your_service_role_key
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   EMAIL_FROM="Nolads Engineering <no-reply@yourdomain.com>"
   CONTACT_RECIPIENT=contact@yourdomain.com
   QUOTES_RECIPIENT=quotes@yourdomain.com
   GA4_PROPERTY_ID=your_ga4_property_id
   GA4_CLIENT_EMAIL=your_service_account_email
   GA4_PRIVATE_KEY="your_private_key"
   CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
   ```

4. **Deploy**

### 2.3 Note the Vercel URL
After deployment, you'll get a URL like: `https://your-app.vercel.app`

## Step 3: Update Frontend Configuration

### 3.1 Update API Endpoints
Update your frontend to use the Vercel API URL. Create `client/src/config/production.ts`:

```typescript
export const config = {
  apiUrl: 'https://your-app.vercel.app/api',
  supabaseUrl: 'your_supabase_url',
  supabaseAnonKey: 'your_supabase_anon_key'
};
```

### 3.2 Update Environment Variables
Create `.env.production` in the root directory:

```env
VITE_API_URL=https://your-app.vercel.app/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GA4_MEASUREMENT_ID=G-YOUR_MEASUREMENT_ID
```

### 3.3 Rebuild and Redeploy Frontend
```bash
npm run build:client
```

Upload the new `dist` contents to cPanel.

## Step 4: Domain Configuration

### 4.1 Configure DNS
- Point your domain to your cPanel hosting
- Set up subdomain for API if needed (e.g., `api.yourdomain.com`)

### 4.2 SSL Certificate
- Enable SSL in cPanel
- Ensure HTTPS is working for both frontend and backend

### 4.3 Custom Domain for Vercel (Optional)
- Add custom domain in Vercel dashboard
- Configure DNS to point to Vercel

## Step 5: Testing

### 5.1 Test Frontend
- Visit your domain
- Check all pages load correctly
- Test contact forms
- Verify all assets load

### 5.2 Test Backend
- Test API endpoints: `https://your-app.vercel.app/api/health`
- Check email functionality
- Verify database connections

## Troubleshooting

### Common Issues:

1. **404 on page refresh**: Ensure `.htaccess` is properly configured
2. **API calls failing**: Check CORS configuration and API URL
3. **Assets not loading**: Verify file paths and permissions
4. **Email not working**: Check SMTP configuration and credentials
5. **Vercel timeout**: Check function timeout limits (10s for hobby plan)

### Performance Optimization:

1. **Enable GZIP compression** (included in .htaccess)
2. **Set proper cache headers** (included in .htaccess)
3. **Optimize images** before upload
4. **Use Vercel's CDN** for static assets

## Maintenance

### Regular Tasks:
- Update dependencies
- Monitor Vercel function logs
- Backup database
- Check SSL certificate expiry

### Updates:
1. Make changes locally
2. Build frontend: `npm run build:client`
3. Upload new `dist` contents to cPanel
4. Deploy backend changes to Vercel (automatic with GitHub integration)

## Cost Estimation

- **cPanel Hosting**: $3-10/month (shared hosting)
- **Vercel Backend**: $0/month (hobby plan) - $20/month (pro plan)
- **Domain**: $10-15/year
- **Total**: ~$3-25/month

## Vercel Advantages

1. **Automatic deployments** from GitHub
2. **Global CDN** for fast API responses
3. **Serverless scaling** - pay only for usage
4. **Built-in monitoring** and analytics
5. **Easy environment management**
6. **Free SSL certificates**

## Alternative: Full Vercel Solution

If you want everything on Vercel:
1. Deploy frontend to Vercel as well
2. Use Vercel's static hosting
3. Everything in one platform
4. Automatic deployments and scaling

This would eliminate the need for cPanel entirely.
