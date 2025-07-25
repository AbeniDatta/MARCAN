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
} = require('../controllers/listingController');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// Protected routes that require authentication
router.post('/', authenticateToken, createListing);
router.post('/draft', authenticateToken, saveDraft);
router.get('/my-listings', authenticateToken, getListingsByCurrentUser);
router.get('/my-drafts', authenticateToken, getMyDrafts);
router.get('/user/:userId', authenticateToken, getListingsByUserId);
router.put('/:id', authenticateToken, updateListing);
router.put('/:id/publish', authenticateToken, publishDraft);
router.delete('/:id', authenticateToken, deleteListing);
router.delete('/admin/:id', authenticateToken, adminOnly, deleteListing);

// Public routes - order matters! More specific routes first
router.get('/', getAllListings);
router.get('/search', searchListings);
router.get('/filters', getFilterOptions);
router.get('/firebase-uid/:firebaseUid', getListingsByFirebaseUid);
router.get('/:id', getListingById);

module.exports = router;