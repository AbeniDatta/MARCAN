#!/bin/bash

# Exit on any error
set -e

# Install global dependencies
npm install -g prisma

# Install root dependencies
npm install

# Install client dependencies including dev dependencies
cd client
npm install --include=dev

# Build the client
npm run build

# Go back to root and install server dependencies including dev dependencies
cd ../server
rm -rf node_modules
npm install --include=dev --no-optional

# Generate Prisma client
prisma generate

# Verify Express installation
echo "Verifying Express installation..."
node -e "console.log('Express version:', require('express/package.json').version)"

# Skip database migrations during build for session pooler URLs
echo "Skipping database migrations during build"
echo "Note: Session pooler URLs don't support schema migrations"
echo "Schema changes should be applied to the direct database URL"

echo "Build completed successfully!" 