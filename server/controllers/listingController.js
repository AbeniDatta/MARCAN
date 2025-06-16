const prisma = require('../prismaClient');

// Create a new listing
const createListing = async (req, res) => {
  const { title, description, price, userId } = req.body;
  try {
    const newListing = await prisma.listing.create({
      data: {
        title,
        description,
        price,
        userId,
      },
    });
    res.status(201).json(newListing);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create listing', details: err });
  }
};

// Get all listings
const getAllListings = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

// Get a listing by ID
const getListingById = async (req, res) => {
  const { id } = req.params;
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(400).json({ error: 'Error fetching listing' });
  }
};

// Get listings by user ID
const getListingsByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const listings = await prisma.listing.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(listings);
  } catch (err) {
    res.status(400).json({ error: 'Error fetching user listings' });
  }
};

// Update a listing
const updateListing = async (req, res) => {
  const { id } = req.params;
  const { title, description, price } = req.body;
  try {
    const updated = await prisma.listing.update({
      where: { id: parseInt(id) },
      data: { title, description, price },
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update listing' });
  }
};

// Delete a listing
const deleteListing = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.listing.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete listing' });
  }
};

module.exports = {
  createListing,
  getAllListings,
  getListingById,
  getListingsByUserId,
  updateListing,
  deleteListing,
};