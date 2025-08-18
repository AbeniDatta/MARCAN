const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const userRoutes = require('./routes/userRoutes');
const listingRoutes = require('./routes/listingRoutes');
const chatRoutes = require('./routes/chatRoutes');
const fileRoutes = require('./routes/fileRoutes');
const prisma = require('./prismaClient');

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://marcan-marketplace.onrender.com', 'https://your-custom-domain.com']
    : 'http://localhost:5173', // Vite's default port
  credentials: true
}));
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);

// Test route for deployment verification
app.get("/api/test", (req, res) => {
  res.json({
    message: "MARCAN API is running successfully",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Health check endpoint for Render
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// Sample route
app.get("/", (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  } else {
    res.send("MARCAN API is running.");
  }
});

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Something broke!' });
});

// Start server with database connection check
async function startServer() {
  try {
    console.log('Starting server initialization...');
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not set'
    });

    // Test database connection before starting server
    console.log('Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');

    // Skip migrations for session pooler URLs (they don't support schema changes)
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('pooler')) {
      console.log('Detected session pooler URL - skipping migrations');
      console.log('Note: Schema changes should be applied to the direct database URL');
    } else {
      console.log('Skipping migrations during startup for stability');
      console.log('Migrations should be run manually or during build process');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('Server bound to 0.0.0.0 to accept external connections');
      console.log('Environment variables loaded:', {
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not set',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Not set',
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Not set',
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set'
      });
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    console.error('Please check your DATABASE_URL environment variable');
    console.error('Full error details:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();
