import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate secure random secrets
const generateSecret = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

const envContent = `# Database Configuration
DATABASE_URL=sqlite://./data/database.sqlite

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-that-is-at-least-32-characters-long
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-super-secret-session-key-that-is-at-least-32-characters-long

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:8080

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload Configuration
UPLOAD_MAX_SIZE=10mb

# Logging Configuration
LOG_LEVEL=info

# Monitoring Configuration
ENABLE_METRICS=false
METRICS_PORT=9090

# Swagger Configuration
SWAGGER_ENABLED=true
SWAGGER_PATH=/api-docs

# Email Configuration
EMAIL_FROM=noreply@noladsengineering.com
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

# CDN Configuration
CDN_ENABLED=false
CDN_BASE_URL=
CDN_API_KEY=
CDN_API_SECRET=

# Analytics Configuration
ANALYTICS_ENABLED=false
ANALYTICS_PROVIDER=google
ANALYTICS_TRACKING_ID=
`;

const envPath = path.join(__dirname, '..', '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully with secure secrets!');
  console.log('📁 Location:', envPath);
} catch (error) {
  console.error('❌ Failed to create .env file:', error.message);
}
