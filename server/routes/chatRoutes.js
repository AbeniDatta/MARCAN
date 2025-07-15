const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'Chat API is working!' });
});

// Handle chat queries
router.post('/query', chatController.handleQuery);

// Get chat suggestions
router.get('/suggestions', chatController.getSuggestions);

module.exports = router; 