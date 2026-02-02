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
    if (!process.env.DATABASE_URL) {
        // During build, if DATABASE_URL is not set, create a client with a placeholder
        // This allows the build to complete, but the client won't work until DATABASE_URL is set
        const client = new PrismaClient({
            datasources: {
                db: {
                    url: 'postgresql://user:password@localhost:5432/dbname',
                },
            },
            log: ['error'],
        });
        return client;
    }

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
