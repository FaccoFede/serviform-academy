/*
  Warnings:

  - You are about to drop the column `contentBlocks` on the `Unit` table. All the data in the column will be lost.
  - Made the column `updatedAt` on table `Course` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Unit` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PricingPackage" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "contentBlocks",
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;
