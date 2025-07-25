const express = require('express');
const {
  createUser,
  createOrUpdateProfile,
  getUserProfile,
  getUserProfileById,
  deleteUserFromDatabase,
  deleteUserById,
  getAllUsers
} = require('../controllers/userController');

const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// Public and Authenticated Routes
router.post('/', createUser);
router.post('/profile', authenticateToken, createOrUpdateProfile);
router.get('/profile/:firebaseUid', authenticateToken, getUserProfile);
router.get('/profile/id/:userId', getUserProfileById);
router.delete('/delete', authenticateToken, deleteUserFromDatabase);

// Admin-only Routes
router.get('/', authenticateToken, adminOnly, getAllUsers);
router.delete('/admin/:userId', authenticateToken, adminOnly, deleteUserById);

module.exports = router;