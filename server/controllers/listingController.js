const prisma = require('../prismaClient');
const { getOrCreateUserFromFirebase } = require('./userController');
const serializeBigInts = (data) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

// Helper function to get EST timestamp
const getESTTimestamp = () => {
  const now = new Date();
  const estOffset = -5 * 60 * 60 * 1000; // EST is UTC-5
  return now.getTime() + estOffset;
};

// Create a new listing
const createListing = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { title, description, price, tags, categories, imageUrl, fileUrl, city } = req.body;

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
      fileUrl,
      tags,
      categories,
      city,
      userId: user.id, // Use the actual user ID from our database
      timestamp: getESTTimestamp() // EST timestamp for sorting
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
    const { sortBy = "most-relevant" } = req.query;

    let orderBy;
    if (sortBy === "new-to-old") {
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "old-to-new") {
      orderBy = { createdAt: "asc" };
    } else {
      orderBy = undefined; // We'll sort by relevance client-side
    }

    const listings = await prisma.listing.findMany({
      where: { isDraft: false },
      include: { user: true },
      ...(orderBy ? { orderBy } : {}),
    });

    const serializedListings = listings.map(listing => ({
      ...listing,
      timestamp: listing.timestamp ? Number(listing.timestamp) : null,
    }));

    res.json(serializedListings);
  } catch (err) {
    console.error("Error fetching all listings:", err);
    res.status(500).json({ error: "Failed to fetch listings" });
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

    // Convert BigInt timestamp to regular number for JSON serialization
    const serializedListing = {
      ...listing,
      timestamp: listing.timestamp ? Number(listing.timestamp) : null
    };

    res.json(serializedListing);
  } catch (err) {
    res.status(400).json({ error: 'Error fetching listing' });
  }
};

// Get listings by user ID
const getListingsByUserId = async (req, res) => {
  const { userId } = req.params;
  console.log('=== GET LISTINGS BY USER ID ===');
  console.log('User ID:', userId);
  console.log('Parsed User ID:', parseInt(userId));

  try {
    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    console.log('User found:', user);

    if (!user) {
      console.log('User not found with ID:', parseInt(userId));
      return res.status(404).json({ error: 'User not found' });
    }

    const listings = await prisma.listing.findMany({
      where: { userId: parseInt(userId) },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    console.log('Found listings:', listings.length);
    console.log('Listings:', listings.map(l => ({ id: l.id, title: l.title, userId: l.userId })));
    res.json(listings);
  } catch (err) {
    console.error('Error fetching user listings:', err);
    console.error('Error stack:', err.stack);
    res.status(400).json({ error: 'Error fetching user listings', details: err.message });
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
      where: {
        userId: user.id,
        isDraft: false
      },
      orderBy: { createdAt: 'desc' },
    });

    // Ensure BigInt (e.g., timestamp) is JSON-safe
    res.json(serializeBigInts(listings));
  } catch (err) {
    console.error('Error fetching user listings', err);
    res.status(400).json({ error: 'Error fetching user listings' });
  }
};

// Get listings by Firebase UID
const getListingsByFirebaseUid = async (req, res) => {
  const { firebaseUid } = req.params;
  try {
    const user = await prisma.user.findFirst({
      where: { firebaseUid }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const listings = await prisma.listing.findMany({
      where: { userId: user.id, isDraft: false }, // hide drafts if desired
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    // Ensure no BigInt sneaks into res.json
    res.json(serializeBigInts(listings));
  } catch (err) {
    console.error('Error fetching listings by Firebase UID:', err);
    res.status(400).json({ error: 'Error fetching user listings' });
  }
};

// Update a listing
const updateListing = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, tags, categories, imageUrl, fileUrl, city } = req.body;

  console.log('=== UPDATE LISTING REQUEST ===');
  console.log('Listing ID:', id);
  console.log('Request body:', req.body);
  console.log('Parsed fields:', { title, description, price, tags, categories, imageUrl, fileUrl, city });

  try {
    const updateData = {
      title,
      description,
      price: parseFloat(price),
      tags,
      categories,
      imageUrl,
      fileUrl,
      city
    };
    console.log('Update data being sent to Prisma:', updateData);

    const updated = await prisma.listing.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    console.log('Successfully updated listing:', updated);
    console.log('Sending response to frontend');
    res.json(updated);
  } catch (err) {
    console.error('Error updating listing:', err);
    console.error('Error stack:', err.stack);
    res.status(400).json({ error: 'Failed to update listing', details: err.message });
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

// Save listing as draft
const saveDraft = async (req, res) => {
  try {
    console.log('Received draft request body:', req.body);
    const { title, description, price, tags, categories, imageUrl, fileUrl, city } = req.body;

    // Get the Firebase user from the request (set by auth middleware)
    const firebaseUser = req.user;
    if (!firebaseUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get or create the user in our database
    const user = await getOrCreateUserFromFirebase(firebaseUser);
    console.log('Found/created user for draft:', user);

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
      fileUrl,
      tags,
      categories,
      city,
      isDraft: true,
      userId: user.id, // Use the actual user ID from our database
      timestamp: getESTTimestamp() // EST timestamp for sorting
    };

    console.log('Creating draft with data:', listingData);
    const newDraft = await prisma.listing.create({
      data: listingData
    });
    console.log('Successfully created draft:', newDraft);
    res.json(serializeBigInts(newDraft));
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get current user's drafts
const getMyDrafts = async (req, res) => {
  try {
    const firebaseUser = req.user;
    if (!firebaseUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await getOrCreateUserFromFirebase(firebaseUser);
    const drafts = await prisma.listing.findMany({
      where: {
        userId: user.id,
        isDraft: true
      },
      orderBy: { createdAt: 'desc' },
    });

    // Ensure BigInt is JSON-safe
    res.json(serializeBigInts(drafts));
  } catch (err) {
    console.error('Error fetching drafts:', err);
    res.status(400).json({ error: 'Error fetching drafts' });
  }
};

// Publish draft
const publishDraft = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.listing.update({
      where: { id: parseInt(id) },
      data: { isDraft: false },
    });
    res.json(serializeBigInts(updated));
  } catch (err) {
    console.error('Error publishing draft:', err);
    res.status(400).json({ error: 'Failed to publish draft' });
  }
};

const getFilterOptions = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      select: { categories: true, tags: true, city: true }
    });

    // Flatten arrays and dedupe
    const categorySet = new Set();
    const tagSet = new Set();
    const locationSet = new Set();

    listings.forEach(listing => {
      (listing.categories || []).forEach(cat => categorySet.add(cat));
      (listing.tags || []).forEach(tag => tagSet.add(tag));
      if (listing.city) {
        locationSet.add(listing.city);
      }
    });

    const categories = Array.from(categorySet);
    const tags = Array.from(tagSet);
    const locations = Array.from(locationSet).sort();

    res.json({ categories, tags, locations });
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

    // Convert BigInt timestamps to regular numbers for JSON serialization
    const serializedListings = listings.map(listing => ({
      ...listing,
      timestamp: listing.timestamp ? Number(listing.timestamp) : null
    }));

    res.json(serializedListings);
  } catch (err) {
    console.error("Error in searchListings:", err);
    res.status(500).json({ error: "Error searching listings" });
  }
};

// Save a listing
const saveListing = async (req, res) => {
  try {
    const firebaseUser = req.user;
    const { listingId } = req.body;

    if (!firebaseUser) return res.status(401).json({ error: 'User not authenticated' });
    if (!listingId) return res.status(400).json({ error: 'Listing ID is required' });

    const user = await getOrCreateUserFromFirebase(firebaseUser);

    const saved = await prisma.savedListing.create({
      data: {
        userId: user.id,
        listingId: parseInt(listingId)
      }
    });

    res.json(saved);
  } catch (error) {
    console.error("Error saving listing:", error);
    res.status(500).json({ error: "Failed to save listing" });
  }
};

// Get saved listings for current user
const getSavedListings = async (req, res) => {
  try {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'User not authenticated' });

    const user = await getOrCreateUserFromFirebase(firebaseUser);

    const saved = await prisma.savedListing.findMany({
      where: { userId: user.id },
      include: {
        listing: {
          include: { user: true }
        }
      }
    });

    const listings = saved.map(entry => ({
      ...entry.listing,
      timestamp: entry.listing.timestamp ? Number(entry.listing.timestamp) : null
    }));

    res.json(listings);
  } catch (error) {
    console.error("Error fetching saved listings:", error);
    res.status(500).json({ error: "Failed to fetch saved listings" });
  }
};

// Unsave a listing
const unsaveListing = async (req, res) => {
  try {
    const firebaseUser = req.user;
    const { listingId } = req.body;

    if (!firebaseUser) return res.status(401).json({ error: 'User not authenticated' });
    if (!listingId) return res.status(400).json({ error: 'Listing ID is required' });

    const user = await getOrCreateUserFromFirebase(firebaseUser);

    await prisma.savedListing.delete({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId: parseInt(listingId)
        }
      }
    });

    res.json({ message: 'Listing unsaved successfully' });
  } catch (error) {
    console.error("Error unsaving listing:", error);
    res.status(500).json({ error: "Failed to unsave listing" });
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
  saveDraft,
  getMyDrafts,
  publishDraft,
  saveListing,
  getSavedListings,
  unsaveListing,
};