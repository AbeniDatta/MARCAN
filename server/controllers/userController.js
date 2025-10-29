const prisma = require('../prismaClient');
const admin = require('firebase-admin');
const serializeBigInts = (data) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

const createUser = async (req, res) => {
  const { firstName, lastName, email, firebaseUid, companyName } = req.body;

  try {
    const newUser = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        firebaseUid,
        companyName,
      },
    });
    res.json(serializeBigInts(newUser));
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send("Error creating user: " + error.message);
  }
};

// Create or update user profile
const createOrUpdateProfile = async (req, res) => {
  console.log('=== Profile Creation/Update Request ===');
  console.log('Request body:', req.body);
  console.log('Firebase user:', req.user);

  const {
    name,
    companyName,
    address1,
    address2,
    city,
    province,
    postalCode,
    country,
    website,
    description,
    phone,
    logoUrl,
    chatbotName,
    accountType, // 'buyer' | 'seller'
    isVerified,
    firebaseUid,
    email
  } = req.body;

  // Normalize and validate inputs for sellers
  const normalizedAccountType = (accountType || 'buyer').toLowerCase();
  const normalizedCountry = country || 'Canada';
  const canadianPostalRegex = /^(?:(?:A|B|C|E|G|H|J|K|L|M|N|P|R|S|T|V|X|Y)[0-9](?:A|B|C|E|G|H|J|K|L|M|N|P|R|S|T|V|W|X|Y)[\s-]?[0-9](?:A|B|C|E|G|H|J|K|L|M|N|P|R|S|T|V|W|X|Y)[0-9])$/i;
  if (normalizedAccountType === 'seller') {
    if (!postalCode || !canadianPostalRegex.test(postalCode.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'A valid Canadian postal code is required for seller accounts.' });
    }
    if (!normalizedCountry || normalizedCountry.toLowerCase() !== 'canada') {
      return res.status(400).json({ error: 'Seller accounts must be registered in Canada.' });
    }
  }

  try {
    // Check if user exists by firebaseUid first
    let user = await prisma.user.findFirst({
      where: { firebaseUid }
    });

    console.log('Existing user found by firebaseUid:', user);

    if (user) {
      // Update existing user
      console.log('Updating existing user profile');
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          companyName,
          address1,
          address2,
          city,
          province,
          postalCode,
          country: normalizedCountry,
          website,
          description,
          phone,
          logoUrl,
          chatbotName,
          accountType: normalizedAccountType,
          // Buyers are auto-verified, sellers default false unless explicitly set by admin
          isVerified: typeof isVerified === 'boolean' ? isVerified : (normalizedAccountType === 'buyer' ? true : user.isVerified),
          email: email || user.email, // Update email if provided, otherwise keep existing
        },
      });
      console.log('User profile updated:', user);
    } else {
      // Check if user exists by email (in case of previous failed signup)
      const existingUserByEmail = await prisma.user.findFirst({
        where: { email }
      });

      if (existingUserByEmail) {
        console.log('Found existing user by email, updating firebaseUid');
        // Update the existing user with the new firebaseUid
        user = await prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            firebaseUid,
            name: name || existingUserByEmail.name,
            companyName,
            address1,
            address2,
            city,
            province,
            postalCode,
            country: normalizedCountry,
            website,
            description,
            phone,
            logoUrl,
            chatbotName,
            accountType: normalizedAccountType,
            isVerified: typeof isVerified === 'boolean' ? isVerified : (normalizedAccountType === 'buyer'),
          },
        });
        console.log('User profile updated with new firebaseUid:', user);
      } else {
        // Create new user
        console.log('Creating new user profile');
        user = await prisma.user.create({
          data: {
            name: name || companyName || firebaseUid, // Prefer provided name
            email: email || '', // Use provided email
            firebaseUid,
            companyName,
            address1,
            address2,
            city,
            province,
            postalCode,
            country: normalizedCountry,
            website,
            description,
            phone,
            logoUrl,
            chatbotName,
            accountType: normalizedAccountType,
            isVerified: typeof isVerified === 'boolean' ? isVerified : (normalizedAccountType === 'buyer'),
          },
        });
        console.log('New user profile created:', user);
      }
    }

    res.json(serializeBigInts(user));
  } catch (error) {
    console.error('Error creating/updating profile:', error);

    // Handle unique constraint violations
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('email')) {
        return res.status(400).json({ error: 'A user with this email already exists.' });
      }
      if (error.meta?.target?.includes('firebaseUid')) {
        return res.status(400).json({ error: 'A user with this Firebase UID already exists.' });
      }
      return res.status(400).json({ error: 'A user with these credentials already exists.' });
    }

    res.status(500).json({ error: error.message });
  }
};

// Get user profile by Firebase UID
const getUserProfile = async (req, res) => {
  const { firebaseUid } = req.params;

  console.log('=== Get User Profile Request ===');
  console.log('Firebase UID:', firebaseUid);
  console.log('Firebase user from auth:', req.user);

  try {
    const user = await prisma.user.findFirst({
      where: { firebaseUid }
    });

    console.log('User found in database:', user);

    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Returning user profile:', user);
    res.json(serializeBigInts(user));
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).send("Error fetching user profile: " + error.message);
  }
};

// Get user profile by user ID
const getUserProfileById = async (req, res) => {
  const { userId } = req.params;

  console.log('=== Get User Profile by ID Request ===');
  console.log('User ID:', userId);

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    console.log('User found in database:', user);

    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Returning user profile:', user);
    res.json(serializeBigInts(user));
  } catch (error) {
    console.error('Error fetching user profile by ID:', error);
    res.status(500).send("Error fetching user profile: " + error.message);
  }
};

// Add a function to get or create user from Firebase UID
const getOrCreateUserFromFirebase = async (firebaseUser) => {
  try {
    console.log('Getting/creating user for Firebase user:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email
    });

    // First try to find the user
    let user = await prisma.user.findFirst({
      where: {
        firebaseUid: firebaseUser.uid
      }
    });

    // If user doesn't exist, create them
    if (!user) {
      console.log('User not found, creating new user');
      user = await prisma.user.create({
        data: {
          name: firebaseUser.name || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          firebaseUid: firebaseUser.uid,
          companyName: firebaseUser.email.split('@')[1]?.split('.')[0] || 'Unknown Company' // Default company name from email domain
        }
      });
      console.log('Created new user:', user);
    } else {
      console.log('Found existing user:', user);
    }

    return user;
  } catch (error) {
    console.error('Error in getOrCreateUserFromFirebase:', error);
    throw error;
  }
};

// Function to update user's company name
const updateUserCompanyName = async (req, res) => {
  const { firebaseUid } = req.params;
  const { companyName } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { firebaseUid },
      data: { companyName },
    });
    res.json(serializeBigInts(updatedUser));
  } catch (error) {
    console.error('Error updating user company name:', error);
    res.status(500).send("Error updating user: " + error.message);
  }
};

const getAllUsers = async (req, res) => {
  const { activeOnly } = req.query; // "true" | undefined
  try {
    if (activeOnly === 'true') {
      // Build a set of active Firebase UIDs
      const activeUids = new Set();
      let nextPageToken = undefined;
      do {
        const result = await admin.auth().listUsers(1000, nextPageToken);
        result.users.forEach(u => activeUids.add(u.uid));
        nextPageToken = result.pageToken;
      } while (nextPageToken);

      // Return only DB users whose firebaseUid is still active in Firebase
      const users = await prisma.user.findMany({
        where: { firebaseUid: { in: Array.from(activeUids) } },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(serializeBigInts(users));
    }

    // default: return all DB users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(serializeBigInts(users));
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const getAllSellers = async (req, res) => {
  try {
    const sellers = await prisma.user.findMany({
      where: {
        accountType: 'seller',
        companyName: { not: null } // Only include sellers with company names
      },
      orderBy: { companyName: 'asc' },
    });
    res.json(serializeBigInts(sellers));
  } catch (err) {
    console.error("Error fetching sellers:", err);
    res.status(500).json({ error: "Failed to fetch sellers" });
  }
};


// Delete user from database by firebaseUid
const deleteUserFromDatabase = async (req, res) => {
  try {
    const firebaseUser = req.user;
    if (!firebaseUser) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log('Attempting to delete user with Firebase UID:', firebaseUser.uid);

    // First check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { firebaseUid: firebaseUser.uid }
    });

    if (!existingUser) {
      console.log('User not found in database, already deleted');
      return res.json({ message: "User already deleted from database" });
    }

    console.log('Found user in database, deleting:', existingUser.email);

    await prisma.user.delete({
      where: { firebaseUid: firebaseUser.uid }
    });

    console.log('User successfully deleted from database');
    res.json({ message: "User deleted from database" });
  } catch (error) {
    console.error('Error deleting user from database:', error);
    if (error.code === "P2025") {
      return res.json({ message: "User already deleted from database" });
    }
    res.status(500).json({ error: error.message });
  }
};

const deleteUserById = async (req, res) => {
  const { userId } = req.params;
  const id = parseInt(userId);

  try {
    await prisma.$transaction(async (tx) => {
      // delete saved listings referencing the user's listings
      await tx.savedListing.deleteMany({
        where: { listing: { userId: id } }, // requires Prisma relation named `listing`
      });

      // delete the user's own saved listings (if model has userId on savedListing)
      await tx.savedListing.deleteMany({ where: { userId: id } });

      // delete listings
      await tx.listing.deleteMany({ where: { userId: id } });

      // finally delete the user
      await tx.user.delete({ where: { id } });
    });

    res.json({ message: "User deleted by admin successfully" });
  } catch (error) {
    console.error("Admin error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user", details: error.message });
  }
};

module.exports = {
  createUser,
  getOrCreateUserFromFirebase,
  updateUserCompanyName,
  createOrUpdateProfile,
  getUserProfile,
  getUserProfileById,
  getAllUsers,
  getAllSellers,
  deleteUserFromDatabase,
  deleteUserById,
};