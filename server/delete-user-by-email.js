const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUserByEmail(email) {
    try {
        console.log(`Attempting to delete user with email: ${email}`);

        const deletedUser = await prisma.user.delete({
            where: { email: email }
        });

        console.log('Successfully deleted user:', deletedUser);
    } catch (error) {
        if (error.code === 'P2025') {
            console.log(`No user found with email: ${email}`);
        } else {
            console.error('Error deleting user:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
    console.log('Usage: node delete-user-by-email.js <email>');
    console.log('Example: node delete-user-by-email.js test@example.com');
    process.exit(1);
}

deleteUserByEmail(email); 