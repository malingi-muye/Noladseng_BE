@echo off
REM Vercel Deployment Script for Nolads Engineering
echo 🚀 Deploying Nolads Engineering to Vercel...

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Check if user is logged in to Vercel
vercel whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Vercel. Please run 'vercel login' first.
    pause
    exit /b 1
)

echo ✅ Vercel CLI ready

REM Build the client
echo 📦 Building client...
npm run build:client

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod

echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo 1. Set environment variables in Vercel dashboard:
echo    - SUPABASE_URL
echo    - SUPABASE_SERVICE_ROLE
echo    - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
echo    - EMAIL_FROM
echo    - CONTACT_RECIPIENT
echo    - QUOTES_RECIPIENT
echo    - GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY
echo.
echo 2. Update frontend API base URL to your Vercel domain
echo 3. Test all endpoints
echo 4. Remove WebSocket dependencies and implement polling/realtime alternatives
echo.
echo 📖 See VERCEL_MIGRATION_GUIDE.md for detailed instructions
pause
