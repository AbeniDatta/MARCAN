const express = require('express');
const { createUser, createOrUpdateProfile, getUserProfile, getUserProfileById } = require('../controllers/userController.js');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.post('/', createUser);
router.post('/profile', authenticateToken, createOrUpdateProfile);
router.get('/profile/:firebaseUid', authenticateToken, getUserProfile);
router.get('/profile/id/:userId', getUserProfileById);

module.exports = router;