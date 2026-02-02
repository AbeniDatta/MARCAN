import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Prisma 7: Connection URL is configured in prisma.config.ts
// PrismaClient will automatically use the DATABASE_URL from the config
// Use lazy initialization to prevent build-time connection attempts
function getPrismaClient(): PrismaClient {
    if (globalForPrisma.prisma) {
        return globalForPrisma.prisma;
    }

    // Only initialize if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = client;
    }

    return client;
}

export const prisma = getPrismaClient();
