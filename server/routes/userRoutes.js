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
// User: verify their own account - place before parameterized routes
router.post('/verify', authenticateToken, async (req, res) => {
  console.log('=== VERIFY ACCOUNT ROUTE HIT ===');
  console.log('Request body:', req.body);
  console.log('Firebase user:', req.user);

  const { name } = req.body;
  const firebaseUser = req.user;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required for verification' });
  }

  try {
    // Find the user by Firebase UID
    const user = await prisma.user.findFirst({
      where: { firebaseUid: firebaseUser.uid }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only corporate accounts can verify themselves
    if (user.accountType !== 'corporate') {
      return res.status(400).json({ error: 'Only corporate accounts can be verified' });
    }

    // If already verified, return the user
    if (user.isVerified) {
      return res.json(user);
    }

    // Update the user with verification details
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifiedBy: name.trim(),
        verifiedAt: new Date()
      }
    });

    res.json(updated);
  } catch (err) {
    console.error('Error verifying account:', err);
    res.status(500).json({ error: 'Failed to verify account', details: err.message });
  }
});

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