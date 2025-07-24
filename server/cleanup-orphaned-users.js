const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOrphanedUsers() {
    try {
        console.log('Starting cleanup of orphaned users...');

        // Get all users from the database
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firebaseUid: true,
                name: true
            }
        });

        console.log(`Found ${users.length} users in database`);

        // For each user, you can manually decide which ones to delete
        // This is a safety measure - you should review each user before deletion
        for (const user of users) {
            console.log(`User: ${user.name} (${user.email}) - Firebase UID: ${user.firebaseUid}`);
        }

        console.log('\nTo delete a specific user, use:');
        console.log('await prisma.user.delete({ where: { id: USER_ID } });');

        // Example: Delete a specific user by email (uncomment and modify as needed)
        // await prisma.user.deleteMany({
        //   where: {
        //     email: 'test@example.com'
        //   }
        // });

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupOrphanedUsers(); 