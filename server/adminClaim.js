require('dotenv').config(); // Load env vars
const admin = require('./firebase.js'); // adjust path

const setAdminClaim = async (email) => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Admin claim set for: ${email}`);
  } catch (err) {
    console.error('❌ Failed to set admin claim:', err.message);
  }
};

// 👇 Change to the email of the user you want to promote to admin
const emailToPromote = "marcan.initiative@gmail.com";
setAdminClaim(emailToPromote);