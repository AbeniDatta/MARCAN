-- Fix schema to match Prisma schema
-- This migration fixes the table names and column references

-- Step 1: Rename profiles table to seller_profiles if it exists and is named profiles
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') 
       AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'seller_profiles') THEN
        ALTER TABLE "profiles" RENAME TO "seller_profiles";
    END IF;
END $$;

-- Step 2: Fix profile_capabilities table - rename profile_id to seller_profile_id if needed
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profile_capabilities' 
        AND column_name = 'profile_id'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profile_capabilities' 
        AND column_name = 'seller_profile_id'
    ) THEN
        ALTER TABLE "profile_capabilities" RENAME COLUMN "profile_id" TO "seller_profile_id";
    END IF;
END $$;

-- Step 3: Update foreign key constraint if it exists with old name
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'profile_capabilities_profile_id_fkey'
    ) THEN
        ALTER TABLE "profile_capabilities" 
        DROP CONSTRAINT IF EXISTS "profile_capabilities_profile_id_fkey";
        
        ALTER TABLE "profile_capabilities" 
        ADD CONSTRAINT "profile_capabilities_seller_profile_id_fkey" 
        FOREIGN KEY ("seller_profile_id") 
        REFERENCES "seller_profiles"("id") 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Add missing columns to seller_profiles if they don't exist
DO $$ 
BEGIN
    -- Add first_name if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'first_name'
    ) THEN
        ALTER TABLE "seller_profiles" ADD COLUMN "first_name" TEXT;
    END IF;
    
    -- Add last_name if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'last_name'
    ) THEN
        ALTER TABLE "seller_profiles" ADD COLUMN "last_name" TEXT;
    END IF;
    
    -- Add email if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE "seller_profiles" ADD COLUMN "email" TEXT;
    END IF;
    
    -- Add typical_lead_time if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'typical_lead_time'
    ) THEN
        CREATE TYPE "TypicalLeadTime" AS ENUM ('ONE_TWO_WEEKS', 'TWO_FOUR_WEEKS', 'ONE_THREE_MONTHS', 'THREE_PLUS_MONTHS', 'DEPENDS_ON_WORKLOAD');
        ALTER TABLE "seller_profiles" ADD COLUMN "typical_lead_time" "TypicalLeadTime";
    END IF;
    
    -- Add industry_hubs if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'industry_hubs'
    ) THEN
        ALTER TABLE "seller_profiles" ADD COLUMN "industry_hubs" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
    
    -- Add verified if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'verified'
    ) THEN
        ALTER TABLE "seller_profiles" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Update PreferredContactMethod enum to include PHONE if missing
    IF NOT EXISTS (
        SELECT FROM pg_enum 
        WHERE enumlabel = 'PHONE' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PreferredContactMethod')
    ) THEN
        ALTER TYPE "PreferredContactMethod" ADD VALUE 'PHONE';
    END IF;
END $$;

-- Step 5: Create buyer_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS "buyer_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL UNIQUE,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "company_name" TEXT NOT NULL,
    "job_title" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "province" TEXT,
    "primary_processes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "industries_served" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "other_comments" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "buyer_profiles_pkey" PRIMARY KEY ("id")
);

-- Step 6: Create indexes for buyer_profiles if they don't exist
CREATE INDEX IF NOT EXISTS "buyer_profiles_province_idx" ON "buyer_profiles"("province");
CREATE INDEX IF NOT EXISTS "buyer_profiles_created_at_idx" ON "buyer_profiles"("created_at" DESC);

-- Step 7: Fix wishlist_requests to reference buyer_profiles instead of profiles
DO $$ 
BEGIN
    -- Drop old foreign key if it exists
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'wishlist_requests_profile_id_fkey'
    ) THEN
        ALTER TABLE "wishlist_requests" 
        DROP CONSTRAINT "wishlist_requests_profile_id_fkey";
    END IF;
    
    -- Rename column if needed
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'wishlist_requests' 
        AND column_name = 'profile_id'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'wishlist_requests' 
        AND column_name = 'buyer_profile_id'
    ) THEN
        ALTER TABLE "wishlist_requests" RENAME COLUMN "profile_id" TO "buyer_profile_id";
    END IF;
    
    -- Add new foreign key
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'wishlist_requests_buyer_profile_id_fkey'
    ) THEN
        ALTER TABLE "wishlist_requests" 
        ADD CONSTRAINT "wishlist_requests_buyer_profile_id_fkey" 
        FOREIGN KEY ("buyer_profile_id") 
        REFERENCES "buyer_profiles"("id") 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Step 8: Update indexes for seller_profiles if they don't exist
CREATE INDEX IF NOT EXISTS "seller_profiles_searchable_idx" ON "seller_profiles"("searchable");
CREATE INDEX IF NOT EXISTS "seller_profiles_province_idx" ON "seller_profiles"("province");
CREATE INDEX IF NOT EXISTS "seller_profiles_verified_idx" ON "seller_profiles"("verified");
CREATE INDEX IF NOT EXISTS "seller_profiles_created_at_idx" ON "seller_profiles"("created_at" DESC);

-- Step 9: Update profile_capabilities indexes
CREATE INDEX IF NOT EXISTS "profile_capabilities_seller_profile_id_idx" ON "profile_capabilities"("seller_profile_id");
CREATE INDEX IF NOT EXISTS "profile_capabilities_capability_id_idx" ON "profile_capabilities"("capability_id");
CREATE INDEX IF NOT EXISTS "profile_capabilities_seller_profile_id_is_core_idx" ON "profile_capabilities"("seller_profile_id", "is_core");
CREATE UNIQUE INDEX IF NOT EXISTS "profile_capabilities_seller_profile_id_capability_id_key" ON "profile_capabilities"("seller_profile_id", "capability_id");
