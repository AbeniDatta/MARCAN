const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getOrCreateUserFromFirebase } = require('./userController');

// Create a new listing
const createListing = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { title, description, price, tags, categories, imageUrl, city} = req.body;

    // Get the Firebase user from the request (set by auth middleware)
    const firebaseUser = req.user;
    if (!firebaseUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get or create the user in our database
    const user = await getOrCreateUserFromFirebase(firebaseUser);
    console.log('Found/created user:', user);

    // Determine company name with fallbacks
    let companyName = user.companyName;
    if (!companyName) {
      // Try to extract company name from email domain
      const emailDomain = user.email.split('@')[1];
      if (emailDomain) {
        companyName = emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);
      } else {
        companyName = user.name; // Fallback to user's name
      }
    }

    const listingData = {
      title,
      description,
      price: parseFloat(price),
      companyName,
      imageUrl,
      tags,
      categories,
      city,
      userId: user.id // Use the actual user ID from our database
    };

    console.log('Creating listing with data:', listingData);
    const newListing = await prisma.listing.create({
      data: listingData
    });
    console.log('Successfully created listing:', newListing);
    res.json(newListing);
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get all listings
const getAllListings = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    console.log('All listings count:', listings.length);
    console.log('Sample listing:', listings[0]);
    res.json(listings);
  } catch (err) {                           
    console.error('Error fetching all listings:', err);
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

// Get listings by current user
const getListingsByCurrentUser = async (req, res) => {
  try {
    const firebaseUser = req.user;
    if (!firebaseUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await getOrCreateUserFromFirebase(firebaseUser);
    const listings = await prisma.listing.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(listings);
  } catch (err) {
    res.status(400).json({ error: 'Error fetching user listings' });
  }
};

// Get listings by Firebase UID
const getListingsByFirebaseUid = async (req, res) => {
  const { firebaseUid } = req.params;
  try {
    // First find the user by Firebase UID
    const user = await prisma.user.findFirst({
      where: { firebaseUid: firebaseUid }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Then get all listings for that user
    const listings = await prisma.listing.findMany({
      where: { userId: user.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(listings);
  } catch (err) {
    console.error('Error fetching listings by Firebase UID:', err);
    res.status(400).json({ error: 'Error fetching user listings' });
  }
};

// Update a listing
const updateListing = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, tags, categories, imageUrl, city } = req.body;
  try {
    const updated = await prisma.listing.update({
      where: { id: parseInt(id) },
      data: { title, description, price, tags, categories, imageUrl, city },
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

const getFilterOptions = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      select: { categories: true, tags: true }
    });

    // Flatten arrays and dedupe
    const categorySet = new Set();
    const tagSet = new Set();

    listings.forEach(listing => {
      (listing.categories || []).forEach(cat => categorySet.add(cat));
      (listing.tags || []).forEach(tag => tagSet.add(tag));
    });

    const categories = Array.from(categorySet);
    const tags = Array.from(tagSet);

    res.json({ categories, tags });
  } catch (err) {
    console.error("Error in getFilterOptions:", err);
    res.status(400).json({ error: "Error fetching listing" });
  }
};

// Search listings by keyword
const searchListings = async (req, res) => {
  try {
    const { query } = req.query;
    console.log('Search query received:', query);

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = query.trim().toLowerCase();
    console.log('Search term:', searchTerm);

    // First, let's get all listings to debug
    const allListings = await prisma.listing.findMany({
      include: { user: true },
    });
    console.log('All listings for debugging:', allListings.map(l => ({
      id: l.id,
      title: l.title,
      description: l.description,
      categories: l.categories,
      tags: l.tags
    })));

    // Try multiple search strategies
    let listings = [];

    // Strategy 1: Direct contains search
    listings = await prisma.listing.findMany({
      where: {
        OR: [
          {
            title: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            companyName: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ]
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    // Strategy 2: Search in arrays (categories and tags)
    if (listings.length === 0) {
      const arrayListings = await prisma.listing.findMany({
        where: {
          OR: [
            {
              categories: {
                hasSome: [searchTerm]
              }
            },
            {
              tags: {
                hasSome: [searchTerm]
              }
            }
          ]
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      // Combine results and remove duplicates
      const allListings = [...listings, ...arrayListings];
      const uniqueListings = allListings.filter((listing, index, self) =>
        index === self.findIndex(l => l.id === listing.id)
      );
      listings = uniqueListings;
    }

    // Strategy 3: If still no results, try partial word matching
    if (listings.length === 0) {
      const partialListings = await prisma.listing.findMany({
        where: {
          OR: [
            {
              title: {
                contains: searchTerm.split(' ')[0], // Use first word
                mode: 'insensitive'
              }
            },
            {
              description: {
                contains: searchTerm.split(' ')[0],
                mode: 'insensitive'
              }
            }
          ]
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
      listings = partialListings;
    }

    console.log('Search results:', listings.length, 'listings found');
    console.log('Search results details:', listings.map(l => ({
      id: l.id,
      title: l.title,
      description: l.description,
      categories: l.categories,
      tags: l.tags
    })));

    res.json(listings);
  } catch (err) {
    console.error("Error in searchListings:", err);
    res.status(500).json({ error: "Error searching listings" });
  }
};

module.exports = {
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
};