const express = require('express');
const {
  createListing,
  getAllListings,
  getListingById,
  getListingsByUserId,
  getListingsByCurrentUser,
  getListingsByFirebaseUid,
  getFilterOptions,
  searchListings,
  updateListing,
  deleteListing,
  saveDraft,
  getMyDrafts,
  publishDraft,
  saveListing,
  getSavedListings,
  unsaveListing,
} = require('../controllers/listingController');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

// Helper function to serialize BigInt values
const serializeBigInts = (data) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

const router = express.Router();

// Protected routes that require authentication
router.post('/', authenticateToken, createListing);
router.post('/draft', authenticateToken, saveDraft);
router.get('/my-listings', authenticateToken, getListingsByCurrentUser);
router.get('/my-drafts', authenticateToken, getMyDrafts);
router.get('/saved', authenticateToken, getSavedListings);
router.put('/:id', authenticateToken, updateListing);
router.put('/:id/publish', authenticateToken, publishDraft);
router.post('/save', authenticateToken, saveListing);
router.post('/unsave', authenticateToken, unsaveListing);
router.delete('/:id', authenticateToken, deleteListing);
router.delete('/admin/:id', authenticateToken, adminOnly, deleteListing);

// Admin: get all listings including hidden ones
router.get('/admin/all', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { sortBy = "most-relevant" } = req.query;
    const prisma = require('../prismaClient');

    let orderBy;
    if (sortBy === "new-to-old") {
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "old-to-new") {
      orderBy = { createdAt: "asc" };
    } else {
      orderBy = undefined;
    }

    // Admin can see all listings including hidden ones, but exclude listings from unverified corporate accounts
    const listings = await prisma.listing.findMany({
      where: {
        isDraft: false,  // Exclude drafts
        user: {
          OR: [
            { accountType: 'individual' },  // Individual accounts don't need verification
            {
              AND: [
                { accountType: 'corporate' },
                { isVerified: true }  // Corporate accounts must be verified
              ]
            }
          ]
        }
      },
      include: { user: true },
      ...(orderBy ? { orderBy } : {}),
    });

    const serializedListings = listings.map(listing => ({
      ...listing,
      timestamp: listing.timestamp ? Number(listing.timestamp) : null,
    }));

    res.json(serializedListings);
  } catch (err) {
    console.error("Error fetching all listings for admin:", err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// Admin: toggle listing visibility (show/hide)
router.put('/admin/:id/visibility', authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { isHidden } = req.body;
  const prisma = require('../prismaClient');

  if (typeof isHidden !== 'boolean') {
    return res.status(400).json({ error: 'isHidden must be a boolean' });
  }

  const listingId = parseInt(id);
  if (isNaN(listingId)) {
    return res.status(400).json({ error: 'Invalid listing ID' });
  }

  try {
    const existingListing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { isHidden }
    });

    res.json(serializeBigInts(updated));
  } catch (err) {
    console.error('Error updating listing visibility:', err);
    res.status(500).json({ error: 'Failed to update listing visibility', details: err.message });
  }
});

// User: toggle own listing visibility (show/hide)
router.put('/:id/visibility', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { isHidden } = req.body;
  const prisma = require('../prismaClient');

  if (typeof isHidden !== 'boolean') {
    return res.status(400).json({ error: 'isHidden must be a boolean' });
  }

  const listingId = parseInt(id);
  if (isNaN(listingId)) {
    return res.status(400).json({ error: 'Invalid listing ID' });
  }

  try {
    const firebaseUser = req.user;
    const user = await prisma.user.findFirst({
      where: { firebaseUid: firebaseUser.uid }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingListing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check if user owns this listing
    if (existingListing.userId !== user.id) {
      return res.status(403).json({ error: 'You can only update your own listings' });
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { isHidden }
    });

    res.json(serializeBigInts(updated));
  } catch (err) {
    console.error('Error updating listing visibility:', err);
    res.status(500).json({ error: 'Failed to update listing visibility', details: err.message });
  }
});

// Public routes - order matters! More specific routes first
router.get('/', getAllListings);
router.get('/search', searchListings);
router.get('/filters', getFilterOptions);
router.get('/user/:userId', getListingsByUserId);
router.get('/firebase-uid/:firebaseUid', getListingsByFirebaseUid);
router.get('/:id', getListingById);

module.exports = router;