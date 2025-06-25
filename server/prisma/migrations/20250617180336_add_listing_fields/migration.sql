/*
  Warnings:

  - Added the required column `companyName` to the `Listing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "categories" TEXT[],
ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "tags" TEXT[];
