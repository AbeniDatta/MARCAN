-- AlterTable
ALTER TABLE "User" ALTER COLUMN "accountType" SET DEFAULT 'individual';

-- Data migration to map legacy values to new names
UPDATE "User" SET "accountType" = 'individual' WHERE "accountType" = 'buyer';
UPDATE "User" SET "accountType" = 'corporate'  WHERE "accountType" = 'seller';
