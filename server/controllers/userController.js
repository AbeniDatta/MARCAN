const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    res.json(newUser);
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
    companyName,
    address1,
    address2,
    city,
    province,
    postalCode,
    website,
    description,
    phone,
    logoUrl,
    chatbotName,
    firebaseUid,
    email
  } = req.body;

  try {
    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { firebaseUid }
    });

    console.log('Existing user found:', user);

    if (user) {
      // Update existing user
      console.log('Updating existing user profile');
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          companyName,
          address1,
          address2,
          city,
          province,
          postalCode,
          website,
          description,
          phone,
          logoUrl,
          chatbotName,
          email: email || user.email, // Update email if provided, otherwise keep existing
        },
      });
      console.log('User profile updated:', user);
    } else {
      // Create new user
      console.log('Creating new user profile');
      user = await prisma.user.create({
        data: {
          name: companyName || firebaseUid, // Use company name as display name
          email: email || '', // Use provided email
          firebaseUid,
          companyName,
          address1,
          address2,
          city,
          province,
          postalCode,
          website,
          description,
          phone,
          logoUrl,
          chatbotName,
        },
      });
      console.log('New user profile created:', user);
    }

    res.json(user);
  } catch (error) {
    console.error('Error creating/updating profile:', error);
    res.status(500).send("Error creating/updating profile: " + error.message);
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
    res.json(user);
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
    res.json(user);
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
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user company name:', error);
    res.status(500).send("Error updating user: " + error.message);
  }
};

module.exports = {
  createUser,
  getOrCreateUserFromFirebase,
  updateUserCompanyName,
  createOrUpdateProfile,
  getUserProfile,
  getUserProfileById
};