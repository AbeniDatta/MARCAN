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

    // Ensure DATABASE_URL is available
    // If not set, Prisma will use the connection string from prisma.config.ts or environment
    // During build, we'll create a client that will fail gracefully if DATABASE_URL is missing
    const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = client;
    }

    return client;
}

// Export a getter function instead of the client directly
// This ensures Prisma is only initialized when actually used, not during module import
// During build, Next.js might try to evaluate this, so we use a Proxy to defer initialization
let _prismaClient: PrismaClient | null = null;

export const prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
        // Only initialize when actually accessed (not during module evaluation)
        if (!_prismaClient) {
            _prismaClient = getPrismaClient();
        }
        const value = (_prismaClient as any)[prop];
        if (typeof value === 'function') {
            return value.bind(_prismaClient);
        }
        return value;
    },
});
