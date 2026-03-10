# Fix Database Schema Error

## The Problem
You're getting this error:
```
Invalid `prisma.sellerProfile.findUnique()` invocation:
The column `(not available)` does not exist in the current database.
```

This happens because your database schema is out of sync with your Prisma schema.

## Quick Fix (Recommended)

Run this command to automatically sync your database schema:

```bash
npm run db:push
```

This will:
- ✅ Create missing tables (`seller_profiles`, `buyer_profiles`)
- ✅ Add missing columns
- ✅ Fix foreign key relationships
- ✅ Create all necessary indexes

## Alternative: Run the Fix Script

If `db:push` doesn't work, run:

```bash
npm run db:fix
```

This runs a custom SQL script that fixes the schema.

## For Production/Deployment

If you're deploying on Render or another platform:

1. **Option 1**: Add to build command temporarily:
   ```
   npm install && npm run db:push && npm run build
   ```

2. **Option 2**: Run via Render Shell/SSH:
   - Connect to your Render instance
   - Run: `npm run db:push`

3. **Option 3**: Run locally with production DATABASE_URL:
   ```bash
   DATABASE_URL="your_production_url" npm run db:push
   ```

## What Gets Fixed

- Renames `profiles` → `seller_profiles` (if needed)
- Fixes `profile_capabilities.profile_id` → `seller_profile_id`
- Creates `buyer_profiles` table
- Adds missing columns: `first_name`, `last_name`, `email`, `typical_lead_time`, `industry_hubs`, `verified`
- Fixes all foreign key relationships
- Creates all indexes

## After Running the Fix

Once the schema is synced, seller account creation will work properly. The temporary workaround in the code will handle edge cases, but you should still run `db:push` for a permanent fix.
