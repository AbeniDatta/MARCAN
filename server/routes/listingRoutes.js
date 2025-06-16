const express = require('express');
const {
  createListing,
  getAllListings,
  getListingById,
  getListingsByUserId,
  updateListing,
  deleteListing,
} = require('../controllers/listingController');

const router = express.Router();

router.post('/', createListing);
router.get('/', getAllListings);
router.get('/:id', getListingById);
router.get('/user/:userId', getListingsByUserId);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);

module.exports = router;