const prisma = require('../prismaClient');

const adminOnly = async (req, res, next) => {
  const firebaseUser = req.user;

  if (!firebaseUser) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { firebaseUid: firebaseUser.uid },
    });

    if (!user) {
      console.warn(`User not found in DB: ${firebaseUser.uid}`);
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isAdmin) {
      console.warn(`User ${user.email} tried to access admin route`);
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUser = user; // Optional for logging/debug
    next();
  } catch (err) {
    console.error('❌ Error in adminOnly middleware:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { adminOnly };