import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 compatible singleton pattern with PostgreSQL adapter
const prismaClientSingleton = () => {
  // Create PostgreSQL connection pool
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

// Use globalThis to prevent multiple instances during hot-reload
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
