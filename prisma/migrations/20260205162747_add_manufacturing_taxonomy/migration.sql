-- CreateEnum
CREATE TYPE "CapabilityType" AS ENUM ('PROCESS', 'MATERIAL', 'FINISH', 'CERTIFICATION', 'INDUSTRY', 'SERVICE', 'COMPANY_TYPE');

-- CreateTable
CREATE TABLE "capabilities" (
    "id" UUID NOT NULL,
    "type" "CapabilityType" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_capabilities" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "capability_id" UUID NOT NULL,
    "mode" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
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
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primary_intent" TEXT,
    "provinces_served" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shipping_capability" TEXT,
    "min_order_qty" INTEGER,
    "lead_time_min_days" INTEGER,
    "lead_time_max_days" INTEGER,
    "max_part_size_mm_x" INTEGER,
    "max_part_size_mm_y" INTEGER,
    "max_part_size_mm_z" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" TEXT,
    "category" TEXT,
    "badge" TEXT,
    "image_url" TEXT,
    "listing_type" TEXT,
    "condition" TEXT,
    "location" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_requests" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "quantity" TEXT,
    "target_price" TEXT,
    "deadline" TIMESTAMPTZ(6),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wishlist_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "capabilities_type_idx" ON "capabilities"("type");

-- CreateIndex
CREATE UNIQUE INDEX "capabilities_type_slug_key" ON "capabilities"("type", "slug");

-- CreateIndex
CREATE INDEX "profile_capabilities_profile_id_idx" ON "profile_capabilities"("profile_id");

-- CreateIndex
CREATE INDEX "profile_capabilities_capability_id_idx" ON "profile_capabilities"("capability_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_capabilities_profile_id_capability_id_key" ON "profile_capabilities"("profile_id", "capability_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "listings_profile_id_idx" ON "listings"("profile_id");

-- CreateIndex
CREATE INDEX "listings_created_at_idx" ON "listings"("created_at" DESC);

-- CreateIndex
CREATE INDEX "wishlist_requests_profile_id_idx" ON "wishlist_requests"("profile_id");

-- CreateIndex
CREATE INDEX "wishlist_requests_created_at_idx" ON "wishlist_requests"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "profile_capabilities" ADD CONSTRAINT "profile_capabilities_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_capabilities" ADD CONSTRAINT "profile_capabilities_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_requests" ADD CONSTRAINT "wishlist_requests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
