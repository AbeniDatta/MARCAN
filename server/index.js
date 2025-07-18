const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const userRoutes = require('./routes/userRoutes');
const listingRoutes = require('./routes/listingRoutes');
const chatRoutes = require('./routes/chatRoutes');

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

// Sample route
app.get("/", (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  } else {
    res.send("MARCAN API is running.");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment variables loaded:', {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not set',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Not set',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Not set'
  });
});
