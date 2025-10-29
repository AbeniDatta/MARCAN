const express = require('express');
const {
  createUser,
  createOrUpdateProfile,
  getUserProfile,
  getUserProfileById,
  deleteUserFromDatabase,
  deleteUserById,
  getAllUsers,
  getAllSellers
} = require('../controllers/userController');
const prisma = require('../prismaClient');

const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// Public and Authenticated Routes
router.post('/', createUser);
router.post('/profile', authenticateToken, createOrUpdateProfile);
router.get('/profile/:firebaseUid', authenticateToken, getUserProfile);
router.get('/profile/id/:userId', getUserProfileById);
router.get('/sellers', authenticateToken, getAllSellers);
router.delete('/delete', authenticateToken, deleteUserFromDatabase);

// Admin-only Routes
router.get('/', authenticateToken, adminOnly, getAllUsers);
router.delete('/admin/:userId', authenticateToken, adminOnly, deleteUserById);

// Admin: verify a seller account
router.post('/admin/:userId/verify', authenticateToken, adminOnly, async (req, res) => {
  const { userId } = req.params;
  try {
    const updated = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { isVerified: true }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify user', details: err.message });
  }
});

module.exports = router;