#!/bin/sh
# Environment setup script

# Development environment
cat > .env.development << EOL
VITE_API_BASE=/api
VITE_API_PROXY_URL=http://localhost:8000
EOL

# Production environment
cat > .env.production << EOL
VITE_API_BASE=/api
EOL

echo "Environment files created successfully!"
