-- CreateEnum
CREATE TYPE "OnboardingMethod" AS ENUM ('IMPORT', 'MANUAL');

-- CreateEnum
CREATE TYPE "TypicalJobSize" AS ENUM ('PROTOTYPE', 'LOW_VOLUME', 'MEDIUM_VOLUME', 'HIGH_VOLUME');

-- CreateEnum
CREATE TYPE "PreferredContactMethod" AS ENUM ('EMAIL', 'PLATFORM_ONLY');

-- AlterTable
ALTER TABLE "profile_capabilities" ADD COLUMN     "is_core" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "last_verified_at" TIMESTAMPTZ(6),
ADD COLUMN     "onboarding_method" "OnboardingMethod",
ADD COLUMN     "preferred_contact_method" "PreferredContactMethod",
ADD COLUMN     "profile_completeness_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rfq_email" TEXT,
ADD COLUMN     "searchable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxonomy_version" TEXT NOT NULL DEFAULT 'v1',
ADD COLUMN     "typical_job_size" "TypicalJobSize";

-- CreateIndex
CREATE INDEX "profile_capabilities_profile_id_is_core_idx" ON "profile_capabilities"("profile_id", "is_core");

-- CreateIndex
CREATE INDEX "profiles_searchable_idx" ON "profiles"("searchable");

-- CreateIndex
CREATE INDEX "profiles_province_idx" ON "profiles"("province");

-- CreateIndex
CREATE INDEX "profiles_created_at_idx" ON "profiles"("created_at" DESC);
