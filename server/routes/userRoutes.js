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

// Helper function to serialize BigInt values
const serializeBigInts = (data) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

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

    // Update the user with verification details and create history entry
    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verifiedBy: name.trim(),
          verifiedAt: new Date()
        }
      }),
      prisma.verificationHistory.create({
        data: {
          userId: user.id,
          action: 'verified',
          performedBy: name.trim(),
          performedAt: new Date()
        }
      })
    ]);

    res.json(serializeBigInts(updated));
  } catch (err) {
    console.error('Error verifying account:', err);
    res.status(500).json({ error: 'Failed to verify account', details: err.message });
  }
});

router.get('/profile/:firebaseUid', authenticateToken, getUserProfile);
router.get('/profile/id/:userId', getUserProfileById);
router.get('/sellers', authenticateToken, getAllSellers);
router.delete('/delete', authenticateToken, deleteUserFromDatabase);

// Get verification history for current user
router.get('/verification-history', authenticateToken, async (req, res) => {
  try {
    const firebaseUser = req.user;
    const user = await prisma.user.findFirst({
      where: { firebaseUid: firebaseUser.uid }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const history = await prisma.verificationHistory.findMany({
      where: { userId: user.id },
      orderBy: { performedAt: 'desc' }
    });

    res.json(history);
  } catch (err) {
    console.error('Error fetching verification history:', err);
    res.status(500).json({ error: 'Failed to fetch verification history', details: err.message });
  }
});

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
    res.json(serializeBigInts(updated));
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify user', details: err.message });
  }
});

// Admin: toggle account visibility (show/hide)
router.put('/admin/:userId/visibility', authenticateToken, adminOnly, async (req, res) => {
  const { userId } = req.params;
  const { isHidden } = req.body;

  if (typeof isHidden !== 'boolean') {
    return res.status(400).json({ error: 'isHidden must be a boolean' });
  }

  const userIdInt = parseInt(userId);
  if (isNaN(userIdInt)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userIdInt }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent hiding admin accounts
    if (existingUser.isAdmin) {
      return res.status(403).json({ error: 'Cannot modify admin account visibility' });
    }

    // Update user visibility
    const updated = await prisma.user.update({
      where: { id: userIdInt },
      data: { isHidden }
    });

    // If hiding account, automatically hide all its listings
    if (isHidden) {
      await prisma.listing.updateMany({
        where: { userId: userIdInt },
        data: { isHidden: true }
      });
    }

    res.json(serializeBigInts(updated));
  } catch (err) {
    console.error('Error updating account visibility:', err);
    res.status(500).json({ error: 'Failed to update account visibility', details: err.message });
  }
});

// Admin: toggle account visibility (show/hide)
router.put('/admin/:userId/visibility', authenticateToken, adminOnly, async (req, res) => {
  const { userId } = req.params;
  const { isHidden } = req.body;

  if (typeof isHidden !== 'boolean') {
    return res.status(400).json({ error: 'isHidden must be a boolean' });
  }

  const userIdInt = parseInt(userId);
  if (isNaN(userIdInt)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userIdInt }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user visibility
    const updated = await prisma.user.update({
      where: { id: userIdInt },
      data: { isHidden }
    });

    // If hiding account, automatically hide all its listings
    if (isHidden) {
      await prisma.listing.updateMany({
        where: { userId: userIdInt },
        data: { isHidden: true }
      });
    }

    res.json(serializeBigInts(updated));
  } catch (err) {
    console.error('Error updating account visibility:', err);
    res.status(500).json({ error: 'Failed to update account visibility', details: err.message });
  }
});

// Admin: toggle verification status (verify/unverify)
router.put('/admin/:userId/verification', authenticateToken, adminOnly, async (req, res) => {
  const { userId } = req.params;
  const { isVerified } = req.body;

  console.log('=== ADMIN TOGGLE VERIFICATION ===');
  console.log('User ID:', userId);
  console.log('isVerified:', isVerified);
  console.log('Request body:', req.body);

  if (typeof isVerified !== 'boolean') {
    return res.status(400).json({ error: 'isVerified must be a boolean' });
  }

  const userIdInt = parseInt(userId);
  if (isNaN(userIdInt)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userIdInt }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Always set verifiedBy to "Marcan Admin" and verifiedAt to current date when admin toggles
    const updateData = {
      isVerified,
      verifiedBy: 'Marcan Admin',
      verifiedAt: new Date()
    };

    console.log('Update data:', updateData);

    // Update user and create history entry in a transaction
    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userIdInt },
        data: updateData
      }),
      prisma.verificationHistory.create({
        data: {
          userId: userIdInt,
          action: isVerified ? 'verified' : 'unverified',
          performedBy: 'Marcan Admin',
          performedAt: new Date()
        }
      })
    ]);

    console.log('User updated successfully:', updated.id);
    res.json(serializeBigInts(updated));
  } catch (err) {
    console.error('Error updating verification status:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Failed to update verification status', details: err.message });
  }
});

module.exports = router;