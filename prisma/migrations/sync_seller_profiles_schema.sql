-- Comprehensive migration to sync seller_profiles table with Prisma schema
-- Run this on your production database to fix all schema issues

-- Step 1: Create seller_profiles table if it doesn't exist (or rename from profiles)
DO $$ 
BEGIN
    -- If profiles table exists but seller_profiles doesn't, rename it
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') 
       AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'seller_profiles') THEN
        ALTER TABLE "profiles" RENAME TO "seller_profiles";
    END IF;
    
    -- If seller_profiles doesn't exist at all, create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'seller_profiles') THEN
        CREATE TABLE "seller_profiles" (
            "id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "user_id" TEXT NOT NULL UNIQUE,
            "first_name" TEXT,
            "last_name" TEXT,
            "email" TEXT,
            "company_name" TEXT NOT NULL,
            "business_number" TEXT,
            "website" TEXT,
            "phone" TEXT,
            "street_address" TEXT,
            "city" TEXT,
            "province" TEXT,
            "about_us" TEXT,
            "logo_url" TEXT,
            "selected_icon" TEXT,
            "job_title" TEXT,
            "primary_intent" TEXT,
            "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
            "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
            "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
            "provinces_served" TEXT[] DEFAULT ARRAY[]::TEXT[],
            "shipping_capability" TEXT,
            "min_order_qty" INTEGER,
            "lead_time_min_days" INTEGER,
            "lead_time_max_days" INTEGER,
            "max_part_size_mm_x" INTEGER,
            "max_part_size_mm_y" INTEGER,
            "max_part_size_mm_z" INTEGER,
            "typical_job_size" "TypicalJobSize",
            "typical_lead_time" "TypicalLeadTime",
            "industry_hubs" TEXT[] DEFAULT ARRAY[]::TEXT[],
            "rfq_email" TEXT,
            "preferred_contact_method" "PreferredContactMethod",
            "verified" BOOLEAN NOT NULL DEFAULT false,
            "searchable" BOOLEAN NOT NULL DEFAULT false,
            "profile_completeness_score" INTEGER NOT NULL DEFAULT 0,
            "onboarding_method" "OnboardingMethod",
            "taxonomy_version" TEXT NOT NULL DEFAULT 'v1',
            "last_verified_at" TIMESTAMPTZ(6),
            "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Step 2: Add missing columns to seller_profiles if they don't exist
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
    
    -- Add typical_lead_time enum and column if missing
    IF NOT EXISTS (SELECT FROM pg_type WHERE typname = 'TypicalLeadTime') THEN
        CREATE TYPE "TypicalLeadTime" AS ENUM ('ONE_TWO_WEEKS', 'TWO_FOUR_WEEKS', 'ONE_THREE_MONTHS', 'THREE_PLUS_MONTHS', 'DEPENDS_ON_WORKLOAD');
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'typical_lead_time'
    ) THEN
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
    
    -- Add searchable if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'searchable'
    ) THEN
        ALTER TABLE "seller_profiles" ADD COLUMN "searchable" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Add profile_completeness_score if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'profile_completeness_score'
    ) THEN
        ALTER TABLE "seller_profiles" ADD COLUMN "profile_completeness_score" INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add onboarding_method if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'onboarding_method'
    ) THEN
        ALTER TABLE "seller_profiles" ADD COLUMN "onboarding_method" "OnboardingMethod";
    END IF;
    
    -- Add taxonomy_version if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'taxonomy_version'
    ) THEN
        ALTER TABLE "seller_profiles" ADD COLUMN "taxonomy_version" TEXT NOT NULL DEFAULT 'v1';
    END IF;
    
    -- Add last_verified_at if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'last_verified_at'
    ) THEN
        ALTER TABLE "seller_profiles" ADD COLUMN "last_verified_at" TIMESTAMPTZ(6);
    END IF;
    
    -- Add rfq_email if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'rfq_email'
    ) THEN
        ALTER TABLE "seller_profiles" ADD COLUMN "rfq_email" TEXT;
    END IF;
    
    -- Add preferred_contact_method if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'seller_profiles' AND column_name = 'preferred_contact_method'
    ) THEN
        ALTER TABLE "seller_profiles" ADD COLUMN "preferred_contact_method" "PreferredContactMethod";
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

-- Step 3: Fix profile_capabilities table - rename profile_id to seller_profile_id if needed
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

-- Step 4: Update foreign key constraints
DO $$ 
BEGIN
    -- Drop old foreign key if it exists
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'profile_capabilities_profile_id_fkey'
    ) THEN
        ALTER TABLE "profile_capabilities" 
        DROP CONSTRAINT "profile_capabilities_profile_id_fkey";
    END IF;
    
    -- Add new foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'profile_capabilities_seller_profile_id_fkey'
    ) THEN
        ALTER TABLE "profile_capabilities" 
        ADD CONSTRAINT "profile_capabilities_seller_profile_id_fkey" 
        FOREIGN KEY ("seller_profile_id") 
        REFERENCES "seller_profiles"("id") 
        ON DELETE CASCADE;
    END IF;
    
    -- Fix listings foreign key if needed
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'listings_profile_id_fkey'
    ) THEN
        -- Check if it references the wrong table
        IF EXISTS (
            SELECT FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_name = 'listings_profile_id_fkey'
            AND kcu.table_name = 'listings'
        ) THEN
            ALTER TABLE "listings" 
            DROP CONSTRAINT IF EXISTS "listings_profile_id_fkey";
            
            ALTER TABLE "listings" 
            ADD CONSTRAINT "listings_profile_id_fkey" 
            FOREIGN KEY ("profile_id") 
            REFERENCES "seller_profiles"("id") 
            ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Step 5: Create/update indexes
CREATE INDEX IF NOT EXISTS "seller_profiles_searchable_idx" ON "seller_profiles"("searchable");
CREATE INDEX IF NOT EXISTS "seller_profiles_province_idx" ON "seller_profiles"("province");
CREATE INDEX IF NOT EXISTS "seller_profiles_verified_idx" ON "seller_profiles"("verified");
CREATE INDEX IF NOT EXISTS "seller_profiles_created_at_idx" ON "seller_profiles"("created_at" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "seller_profiles_user_id_key" ON "seller_profiles"("user_id");

-- Step 6: Update profile_capabilities indexes
CREATE INDEX IF NOT EXISTS "profile_capabilities_seller_profile_id_idx" ON "profile_capabilities"("seller_profile_id");
CREATE INDEX IF NOT EXISTS "profile_capabilities_capability_id_idx" ON "profile_capabilities"("capability_id");
CREATE INDEX IF NOT EXISTS "profile_capabilities_seller_profile_id_is_core_idx" ON "profile_capabilities"("seller_profile_id", "is_core");
CREATE UNIQUE INDEX IF NOT EXISTS "profile_capabilities_seller_profile_id_capability_id_key" ON "profile_capabilities"("seller_profile_id", "capability_id");

-- Step 7: Create buyer_profiles table if it doesn't exist
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

CREATE INDEX IF NOT EXISTS "buyer_profiles_province_idx" ON "buyer_profiles"("province");
CREATE INDEX IF NOT EXISTS "buyer_profiles_created_at_idx" ON "buyer_profiles"("created_at" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "buyer_profiles_user_id_key" ON "buyer_profiles"("user_id");

-- Step 8: Fix wishlist_requests to reference buyer_profiles
DO $$ 
BEGIN
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
    
    -- Drop old foreign key if it exists
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'wishlist_requests_profile_id_fkey'
    ) THEN
        ALTER TABLE "wishlist_requests" 
        DROP CONSTRAINT "wishlist_requests_profile_id_fkey";
    END IF;
    
    -- Add new foreign key if it doesn't exist
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
