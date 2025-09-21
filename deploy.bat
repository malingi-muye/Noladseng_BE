@echo off
echo 🚀 Starting deployment process...

REM Build frontend
echo 📦 Building frontend...
call npm run build:client

if %errorlevel% equ 0 (
    echo ✅ Frontend build successful!
    echo 📁 Frontend files are ready in the 'dist' folder
    echo.
    echo 📋 Next steps for cPanel deployment:
    echo 1. Access your cPanel File Manager
    echo 2. Navigate to public_html directory
    echo 3. Upload all contents from the 'dist' folder
    echo 4. Upload the '.htaccess' file to public_html
    echo.
    echo 🌐 For Vercel backend deployment:
    echo 1. Run: vercel --prod
    echo 2. Or connect your GitHub repo to Vercel dashboard
    echo 3. Set environment variables in Vercel
    echo.
    echo 🔧 Don't forget to:
    echo - Update VITE_API_URL in your frontend build
    echo - Configure environment variables in Vercel
    echo - Test your deployment
) else (
    echo ❌ Frontend build failed!
    exit /b 1
)
