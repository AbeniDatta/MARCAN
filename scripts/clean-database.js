const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // Delete in order to respect foreign key constraints
    // Delete wishlist requests first (has foreign key to Profile)
    const deletedWishlist = await prisma.wishlistRequest.deleteMany({});
    console.log(`✅ Deleted ${deletedWishlist.count} wishlist requests`);

    // Delete listings (has foreign key to Profile)
    const deletedListings = await prisma.listing.deleteMany({});
    console.log(`✅ Deleted ${deletedListings.count} listings`);

    // Delete profiles last (referenced by listings and wishlist requests)
    const deletedProfiles = await prisma.profile.deleteMany({});
    console.log(`✅ Deleted ${deletedProfiles.count} profiles`);

    console.log('\n✨ Database cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

cleanDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
