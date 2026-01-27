# Environment Variables Setup

## Quick Start

1. Copy the example file to create your local environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your actual credentials in `.env.local`

## Firebase Configuration

Get your Firebase credentials from:
- Firebase Console: https://console.firebase.google.com/
- Project Settings → General → Your apps → Web app config

Required variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Your Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Usually `your-project-id.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Usually `your-project-id.appspot.com`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Your messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Your Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Your Google Analytics measurement ID (optional)

## Database Configuration (Prisma + PostgreSQL)

**Using Prisma ORM with PostgreSQL database**

Get your database connection string from:
- **Supabase:** Dashboard → Settings → Database → Connection string
- **Other PostgreSQL:** Standard PostgreSQL connection string format

**Required variable:**
- `DATABASE_URL` - PostgreSQL connection string
  - Supabase format: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require`
  - Or: `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  - Standard format: `postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require`

**Prisma Commands:**
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:migrate` - Create and apply migrations (production)
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Supabase Configuration (Optional - for Supabase client SDK)

If you're using Supabase client SDK alongside Prisma, get credentials from:
- Supabase Dashboard: https://app.supabase.com/
- Project Settings → API

**Optional variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key (safe for client-side use)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only, NEVER expose to client)
  - This key bypasses Row Level Security (RLS) policies
  - Use only in API routes or server components for admin operations
  - Get from: Supabase Dashboard → Settings → API → service_role key

## Security Notes

- Never commit `.env.local` to git (it's already in `.gitignore`)
- Use `NEXT_PUBLIC_` prefix for variables that need to be accessible in the browser
- Variables without `NEXT_PUBLIC_` are server-side only
- **CRITICAL:** `SUPABASE_SERVICE_ROLE_KEY` bypasses all security policies - only use server-side
- Keep sensitive keys (like service role keys) server-side only
- The anon key is safe for client-side use as it respects RLS policies
