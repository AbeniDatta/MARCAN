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
} = require('../controllers/listingController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protected routes that require authentication
router.post('/', authenticateToken, createListing);
router.get('/my-listings', authenticateToken, getListingsByCurrentUser);
router.get('/user/:userId', authenticateToken, getListingsByUserId);
router.put('/:id', authenticateToken, updateListing);
router.delete('/:id', authenticateToken, deleteListing);

// Public routes
router.get('/', getAllListings);
router.get('/search', searchListings);
router.get('/firebase-uid/:firebaseUid', getListingsByFirebaseUid);
router.get('/filters', getFilterOptions);
router.get('/:id', getListingById);

module.exports = router;