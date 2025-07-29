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
npm install --include=dev

# Generate Prisma client
prisma generate

# Run database migrations
echo "Running database migrations..."
prisma db push

echo "Build completed successfully!" 