const admin = require('../firebase');

const signUp = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    res.status(201).send({ message: "User created successfully", uid: userRecord.uid });
  } catch (error) {
    res.status(500).send("Error creating user: " + error.message);
  }
};

const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await admin.auth().getUserByEmail(email);
    // Authenticate the user using password check or token validation logic
    // You can use Firebase's ID token verification here for JWT-based auth.

    res.status(200).send({ message: "User logged in successfully", uid: user.uid });
  } catch (error) {
    res.status(500).send("Error logging in: " + error.message);
  }
};

module.exports = { signUp, signIn };