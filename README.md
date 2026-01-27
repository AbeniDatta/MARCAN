# Marcan - Manufacturing Canada

A Next.js application for connecting Canadian Micro & Small Enterprises in the manufacturing sector.

## Tech Stack

- **Next.js 14+** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Font Awesome 6.5.1**
- **Prisma** (ORM for PostgreSQL)
- **PostgreSQL** (via Supabase or standalone)
- **Firebase** (Authentication)
- **Supabase** (Optional - for Supabase client SDK)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Set up environment variables:

   - Copy the environment template:
   ```bash
   cp env.template .env.local
   ```

   - Add your credentials to `.env.local`:
     - **DATABASE_URL** - PostgreSQL connection string (required)
     - Firebase credentials (for authentication)
     - Supabase credentials (optional, if using Supabase client SDK)
   
   See `SETUP_ENV.md` for detailed instructions.

3. Set up Prisma and database:

   - Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

   - Push schema to database (development):
   ```bash
   npm run db:push
   ```

   For production, use migrations instead:
   ```bash
   npm run db:migrate
   ```

   See `PRISMA_SETUP.md` for more details.

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
marcan26/
├── app/                    # Next.js App Router pages
│   ├── about/
│   ├── contact/
│   ├── directory/
│   ├── help/
│   ├── login/
│   ├── marketplace/
│   ├── signup/
│   ├── wishlist/
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── AmbientBackground.tsx
│   ├── Header.tsx
│   └── Sidebar.tsx
├── lib/                  # Utility libraries
│   ├── prisma.ts         # Prisma Client instance
│   ├── supabase.ts       # Supabase client (server-side, optional)
│   ├── supabase-client.ts # Supabase client (client-side, optional)
│   └── db/               # Database helper functions
│       ├── profiles.ts
│       ├── listings.ts
│       └── wishlist.ts
├── prisma/               # Prisma configuration
│   └── schema.prisma     # Prisma schema (database models)
├── hooks/                # Custom React hooks
│   └── useAuth.ts        # Authentication hook
├── supabase/             # Supabase SQL schema (legacy)
│   └── schema.sql        # SQL migration file
├── public/               # Static assets
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## Pages

- `/` - Home page
- `/about` - About Us
- `/contact` - Contact Us
- `/directory` - Company Directory
- `/help` - Help Center
- `/login` - Login page
- `/marketplace` - Supplier Listings
- `/signup` - Sign Up page
- `/wishlist` - Buyer Wishlist

## Development Notes

- All pages use the App Router (`app/` directory)
- Shared components (Sidebar, Header, AmbientBackground) are in `/components`
- Global styles and Tailwind configuration are in `app/globals.css` and `tailwind.config.ts`
- **Prisma ORM** is used for database operations (type-safe queries)
- Database schema is defined in `prisma/schema.prisma`
- Database helper functions are in `/lib/db/`
- Environment variables are stored in `.env.local` (not committed to git)

## Database Setup

### Using Prisma

1. **Set up DATABASE_URL** in `.env.local`:
   - For Supabase: Get connection string from Dashboard → Settings → Database
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require`

2. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

3. **Push schema to database** (development):
   ```bash
   npm run db:push
   ```

4. **Use Prisma in your code**:
   ```typescript
   import { prisma } from '@/lib/prisma';
   const profiles = await prisma.profile.findMany();
   ```

See `PRISMA_SETUP.md` for detailed Prisma documentation.

### Optional: Supabase Client SDK

If you want to use Supabase client SDK alongside Prisma:

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your credentials** from Project Settings → API
3. Add to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

## Build for Production

The build command automatically generates Prisma Client:

```bash
npm run build
# or
yarn build
```

**Important:** Make sure `DATABASE_URL` is set in your production environment (e.g., Render dashboard).

Then start the production server:

```bash
npm start
# or
yarn start
```
