/*
  Warnings:

  - You are about to drop the `VideoAsset` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[courseId,slug]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "VideoAsset" DROP CONSTRAINT "VideoAsset_unitId_fkey";

-- DropIndex
DROP INDEX "Unit_slug_key";

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "UserProgress" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "VideoAsset";

-- CreateTable
CREATE TABLE "VideoPill" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "youtubeId" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoPill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_courseId_slug_key" ON "Unit"("courseId", "slug");

-- AddForeignKey
ALTER TABLE "VideoPill" ADD CONSTRAINT "VideoPill_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
