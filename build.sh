#!/bin/bash

# Install root dependencies
npm install

# Install client dependencies including dev dependencies
cd client
npm install --include=dev

# Build the client
npm run build

# Go back to root and install server dependencies
cd ../server
npm install

echo "Build completed successfully!" 