import { prisma } from '../lib/prisma';

async function cleanDatabase() {
  try {
    console.log('Starting database cleanup...');

    // Delete in order to respect foreign key constraints
    // Delete wishlist requests first (has foreign key to Profile)
    const deletedWishlist = await prisma.wishlistRequest.deleteMany({});
    console.log(`Deleted ${deletedWishlist.count} wishlist requests`);

    // Delete listings (has foreign key to Profile)
    const deletedListings = await prisma.listing.deleteMany({});
    console.log(`Deleted ${deletedListings.count} listings`);

    // Delete profiles last (referenced by listings and wishlist requests)
    const deletedProfiles = await prisma.profile.deleteMany({});
    console.log(`Deleted ${deletedProfiles.count} profiles`);

    console.log('✅ Database cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
