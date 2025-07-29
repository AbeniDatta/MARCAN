const prisma = require('../prismaClient');

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
      // Check if this user has a valid Firebase Auth account
      // If not, delete the orphaned record and create a new one
      if (user.firebaseUid !== firebaseUid) {
        console.log('Found orphaned user record, deleting and creating new one');
        await prisma.user.delete({
          where: { id: user.id }
        });
        user = null; // This will trigger the create new user flow
      } else {
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
      }
    }

    if (!user) {
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

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
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

  try {
    await prisma.user.delete({
      where: { id: parseInt(userId) },
    });

    res.json({ message: "User deleted by admin successfully" });
  } catch (error) {
    console.error("Admin error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
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
  deleteUserFromDatabase,
  deleteUserById,
};