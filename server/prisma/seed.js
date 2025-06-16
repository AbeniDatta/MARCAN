const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@example.com',
      password: 'hashedpasswordhere', // use bcrypt if needed
    },
  });

  await prisma.listing.create({
    data: {
      title: 'B2B Equipment',
      description: 'High-quality equipment for sale.',
      price: 1200.00,
      userId: user.id,
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());