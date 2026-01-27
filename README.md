# Marcan - Manufacturing Canada

A Next.js application for connecting Canadian Micro & Small Enterprises in the manufacturing sector.

## Tech Stack

- **Next.js 14+** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Font Awesome 6.5.1**
- **Supabase** (Database & Authentication)

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

2. Set up Supabase:

   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key from the API settings
   - Create a `.env.local` file in the root directory:

   ```bash
   cp .env.local.example .env.local
   ```

   - Add your Supabase credentials to `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   - Run the database migrations in your Supabase SQL editor (see `supabase/schema.sql`)

3. Run the development server:

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
│   ├── supabase.ts       # Supabase client (server-side)
│   ├── supabase-client.ts # Supabase client (client-side)
│   └── db/               # Database helper functions
│       ├── profiles.ts
│       ├── listings.ts
│       └── wishlist.ts
├── hooks/                # Custom React hooks
│   └── useAuth.ts        # Authentication hook
├── supabase/             # Database schema
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
- Supabase is used for database operations and authentication
- Database helper functions are in `/lib/db/`
- Environment variables are stored in `.env.local` (not committed to git)

## Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Get your credentials** from Project Settings → API:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Set up the database schema**:
   - Go to SQL Editor in your Supabase dashboard
   - Run the SQL from `supabase/schema.sql` to create the necessary tables

4. **Configure Row Level Security (RLS)**:
   - Enable RLS on all tables
   - Create policies as needed for your use case

## Build for Production

```bash
npm run build
# or
yarn build
```

Then start the production server:

```bash
npm start
# or
yarn start
```
