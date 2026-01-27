# Prisma Setup Guide

## Overview

This project uses **Prisma ORM** with **PostgreSQL** for database operations. Prisma provides type-safe database access and migrations.

## Initial Setup

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `env.template` to `.env.local`
   - Add your `DATABASE_URL` connection string
   - See `SETUP_ENV.md` for details

3. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```
   This reads `prisma/schema.prisma` and generates the Prisma Client types.

4. **Push schema to database** (development):
   ```bash
   npm run db:push
   ```
   This syncs your Prisma schema with the database (creates/updates tables).

   **Note:** For production, use migrations instead (see below).

## Database Schema

The schema is defined in `prisma/schema.prisma` with three main models:

- **Profile** - Company/user profiles
- **Listing** - Supplier marketplace listings
- **WishlistRequest** - Buyer wishlist requests

## Using Prisma Client

Import and use Prisma Client in your code:

```typescript
import { prisma } from '@/lib/prisma';

// Example: Get all profiles
const profiles = await prisma.profile.findMany();

// Example: Create a profile
const profile = await prisma.profile.create({
  data: {
    userId: 'user-123',
    companyName: 'Example Corp',
    // ... other fields
  },
});

// Example: Find with relations
const profileWithListings = await prisma.profile.findUnique({
  where: { id: 'profile-id' },
  include: {
    listings: true,
    wishlistRequests: true,
  },
});
```

## Prisma Commands

- `npm run db:generate` - Generate Prisma Client (run after schema changes)
- `npm run db:push` - Push schema to database (development, no migration files)
- `npm run db:migrate` - Create and apply migrations (production)
- `npm run db:studio` - Open Prisma Studio (visual database browser)

## Migrations (Production)

For production deployments, use migrations instead of `db:push`:

1. **Create a migration**:
   ```bash
   npm run db:migrate
   ```
   This creates a migration file in `prisma/migrations/`

2. **Apply migrations** (on Render/server):
   ```bash
   npx prisma migrate deploy
   ```

## Getting Database Connection String

### Supabase

1. Go to Supabase Dashboard → Your Project
2. Settings → Database
3. Find "Connection string" section
4. Select "URI" format
5. Copy and replace `[YOUR-PASSWORD]` with your database password
6. Format: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require`

### Other PostgreSQL Providers

Use standard PostgreSQL connection string:
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require
```

## Prisma Studio

Visual database browser:
```bash
npm run db:studio
```

Opens a web interface at `http://localhost:5555` to browse and edit your database.

## Type Safety

Prisma generates TypeScript types based on your schema. After running `db:generate`, you'll have:

- Type-safe database queries
- Autocomplete in your IDE
- Compile-time error checking

## Troubleshooting

### "Prisma Client not generated"
Run: `npm run db:generate`

### "Connection string invalid"
- Check your `DATABASE_URL` format
- Ensure password is URL-encoded if it contains special characters
- Verify database is accessible from your network

### "Schema out of sync"
- Run `npm run db:push` to sync schema with database
- Or create a migration with `npm run db:migrate`

## Next Steps

1. Set up your `DATABASE_URL` in `.env.local`
2. Run `npm run db:generate` to generate Prisma Client
3. Run `npm run db:push` to create tables in your database
4. Start using Prisma in your API routes and server components!
