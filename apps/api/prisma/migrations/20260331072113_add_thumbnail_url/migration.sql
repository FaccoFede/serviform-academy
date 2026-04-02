/*
  Warnings:

  - The `accessType` column on the `CompanyCourseAssignment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `accessType` column on the `UserCourseAssignment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `CourseFeedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CsvImportJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventRegistration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnitFeedback` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CompanyCourseAssignment" DROP CONSTRAINT "CompanyCourseAssignment_companyId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyCourseAssignment" DROP CONSTRAINT "CompanyCourseAssignment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyInterest" DROP CONSTRAINT "CompanyInterest_companyId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyInterest" DROP CONSTRAINT "CompanyInterest_softwareId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyMembership" DROP CONSTRAINT "CompanyMembership_companyId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyMembership" DROP CONSTRAINT "CompanyMembership_userId_fkey";

-- DropForeignKey
ALTER TABLE "CourseFeedback" DROP CONSTRAINT "CourseFeedback_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CourseFeedback" DROP CONSTRAINT "CourseFeedback_userId_fkey";

-- DropForeignKey
ALTER TABLE "EventRegistration" DROP CONSTRAINT "EventRegistration_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventRegistration" DROP CONSTRAINT "EventRegistration_userId_fkey";

-- DropForeignKey
ALTER TABLE "UnitFeedback" DROP CONSTRAINT "UnitFeedback_unitId_fkey";

-- DropForeignKey
ALTER TABLE "UnitFeedback" DROP CONSTRAINT "UnitFeedback_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserCourseAssignment" DROP CONSTRAINT "UserCourseAssignment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "UserCourseAssignment" DROP CONSTRAINT "UserCourseAssignment_userId_fkey";

-- DropIndex
DROP INDEX "Ann_isPinned";

-- DropIndex
DROP INDEX "Ann_section";

-- DropIndex
DROP INDEX "CompanyCourseAssignment_companyId_idx";

-- DropIndex
DROP INDEX "CompanyCourseAssignment_expiresAt_idx";

-- DropIndex
DROP INDEX "UserCourseAssignment_expiresAt_idx";

-- DropIndex
DROP INDEX "UserCourseAssignment_userId_idx";

-- DropIndex
DROP INDEX "UserProgress_viewedAt";

-- AlterTable
ALTER TABLE "Announcement" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CompanyCourseAssignment" ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "accessType",
ADD COLUMN     "accessType" TEXT NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CompanyInterest" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CompanyMembership" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "UserCourseAssignment" ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "accessType",
ADD COLUMN     "accessType" TEXT NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "CourseFeedback";

-- DropTable
DROP TABLE "CsvImportJob";

-- DropTable
DROP TABLE "EventRegistration";

-- DropTable
DROP TABLE "UnitFeedback";

-- DropEnum
DROP TYPE "CourseAccessType";

-- DropEnum
DROP TYPE "CsvImportStatus";

-- DropEnum
DROP TYPE "CsvImportType";

-- AddForeignKey
ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInterest" ADD CONSTRAINT "CompanyInterest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInterest" ADD CONSTRAINT "CompanyInterest_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCourseAssignment" ADD CONSTRAINT "CompanyCourseAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCourseAssignment" ADD CONSTRAINT "CompanyCourseAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCourseAssignment" ADD CONSTRAINT "UserCourseAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCourseAssignment" ADD CONSTRAINT "UserCourseAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
