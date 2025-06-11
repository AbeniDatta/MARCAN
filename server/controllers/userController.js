const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password,
      },
    });
    res.json(newUser);
  } catch (error) {
    res.status(500).send("Error creating user: " + error.message);
  }
};

module.exports = { createUser };