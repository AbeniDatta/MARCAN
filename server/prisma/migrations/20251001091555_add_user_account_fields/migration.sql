-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" TEXT NOT NULL DEFAULT 'buyer',
ADD COLUMN     "country" TEXT DEFAULT 'Canada',
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;
