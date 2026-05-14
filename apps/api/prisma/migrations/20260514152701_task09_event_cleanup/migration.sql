/*
  Warnings:

  - You are about to drop the column `availableSeats` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `isRegistrable` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `recordingUrl` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `registrationUrl` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `registrations` on the `Event` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AnnouncementRead" DROP CONSTRAINT "AnnouncementRead_announcementId_fkey";

-- DropForeignKey
ALTER TABLE "AnnouncementRead" DROP CONSTRAINT "AnnouncementRead_userId_fkey";

-- DropIndex
DROP INDEX "AnnouncementRead_announcementId_idx";

-- DropIndex
DROP INDEX "AnnouncementRead_userId_idx";

-- DropIndex
DROP INDEX "GuideReference_unitId_idx";

-- DropIndex
DROP INDEX "GuideReference_unitId_key";

-- AlterTable
ALTER TABLE "AnnouncementRead" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "availableSeats",
DROP COLUMN "isRegistrable",
DROP COLUMN "recordingUrl",
DROP COLUMN "registrationUrl",
DROP COLUMN "registrations",
ADD COLUMN     "content" TEXT;

-- AlterTable
ALTER TABLE "VideoAsset" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
