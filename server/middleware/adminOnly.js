const prisma = require('../prismaClient');

const adminOnly = async (req, res, next) => {
  const firebaseUser = req.user;

  if (!firebaseUser) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Check Firebase custom claims for admin status
    if (!firebaseUser.admin) {
      console.warn(`User ${firebaseUser.email} tried to access admin route - no admin claim`);
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Also check if user exists in database (optional, for logging)
    const user = await prisma.user.findFirst({
      where: { firebaseUid: firebaseUser.uid },
    });

    if (!user) {
      console.warn(`User not found in DB: ${firebaseUser.uid}`);
      // Don't block access if user exists in Firebase but not in DB
    }

    req.adminUser = user; // Optional for logging/debug
    next();
  } catch (err) {
    console.error('❌ Error in adminOnly middleware:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { adminOnly };