/**
 * apply-migration.ts — Migrazione completa (B2B + Full Update).
 * USO: cd apps/api && npx ts-node prisma/scripts/apply-migration.ts
 * Idempotente: usa IF NOT EXISTS ovunque.
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const steps: [string, string][] = [
  // B2B base
  ['User.firstName',       `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT`],
  ['User.lastName',        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT`],
  ['Unit.videoUrl',        `ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT`],
  ['UserProgress.viewedAt',`ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP(3)`],
  ['Course.objective',     `ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "objective" TEXT`],
  ['enum PublishState',    `DO $$ BEGIN CREATE TYPE "PublishState" AS ENUM ('HIDDEN','VISIBLE_LOCKED','PUBLISHED'); EXCEPTION WHEN duplicate_object THEN null; END $$`],
  ['Course.publishState',  `ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "publishState" "PublishState" NOT NULL DEFAULT 'PUBLISHED'`],
  ['enum AccessType',      `DO $$ BEGIN CREATE TYPE "AccessType" AS ENUM ('ACTIVE','LOCKED','HIDDEN'); EXCEPTION WHEN duplicate_object THEN null; END $$`],
  ['enum AnnouncementType',`DO $$ BEGIN CREATE TYPE "AnnouncementType" AS ENUM ('NEWS','NEW_COURSE','WEBINAR','MAINTENANCE'); EXCEPTION WHEN duplicate_object THEN null; END $$`],
  ['table Company', `CREATE TABLE IF NOT EXISTS "Company" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,"name" TEXT NOT NULL,"slug" TEXT NOT NULL UNIQUE,"contractType" TEXT,"assistanceExpiresAt" TIMESTAMP(3),"notes" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"deletedAt" TIMESTAMP(3))`],
  ['table CompanyMembership', `CREATE TABLE IF NOT EXISTS "CompanyMembership" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,"userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id"),"companyId" TEXT NOT NULL REFERENCES "Company"("id"),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`],
  ['table CompanyInterest', `CREATE TABLE IF NOT EXISTS "CompanyInterest" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,"companyId" TEXT NOT NULL REFERENCES "Company"("id"),"softwareId" TEXT NOT NULL REFERENCES "Software"("id"),UNIQUE("companyId","softwareId"))`],
  ['table CompanyCourseAssignment', `CREATE TABLE IF NOT EXISTS "CompanyCourseAssignment" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,"companyId" TEXT NOT NULL REFERENCES "Company"("id"),"courseId" TEXT NOT NULL REFERENCES "Course"("id"),"accessType" TEXT NOT NULL DEFAULT 'ACTIVE' CHECK ("accessType" IN ('ACTIVE','LOCKED','HIDDEN')),"startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"expiresAt" TIMESTAMP(3),"notes" TEXT,"createdBy" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE("companyId","courseId"))`],
  ['table UserCourseAssignment', `CREATE TABLE IF NOT EXISTS "UserCourseAssignment" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,"userId" TEXT NOT NULL REFERENCES "User"("id"),"courseId" TEXT NOT NULL REFERENCES "Course"("id"),"accessType" TEXT NOT NULL DEFAULT 'ACTIVE' CHECK ("accessType" IN ('ACTIVE','LOCKED','HIDDEN')),"startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"expiresAt" TIMESTAMP(3),"notes" TEXT,"createdBy" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE("userId","courseId"))`],
  ['table Announcement', `CREATE TABLE IF NOT EXISTS "Announcement" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,"title" TEXT NOT NULL,"body" TEXT NOT NULL,"type" "AnnouncementType" NOT NULL DEFAULT 'NEWS',"published" BOOLEAN NOT NULL DEFAULT false,"publishedAt" TIMESTAMP(3),"expiresAt" TIMESTAMP(3),"createdBy" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`],
  // Hotfix accessType cast
  ['hotfix CompanyCourseAssignment.accessType', `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CompanyCourseAssignment' AND column_name='accessType' AND data_type='USER-DEFINED' AND udt_name!='AccessType') THEN ALTER TABLE "CompanyCourseAssignment" ALTER COLUMN "accessType" TYPE TEXT USING "accessType"::text; END IF; END $$`],
  ['hotfix UserCourseAssignment.accessType', `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='UserCourseAssignment' AND column_name='accessType' AND data_type='USER-DEFINED' AND udt_name!='AccessType') THEN ALTER TABLE "UserCourseAssignment" ALTER COLUMN "accessType" TYPE TEXT USING "accessType"::text; END IF; END $$`],
  // Full update
  ['User.mustChangePassword',  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false`],
  ['Announcement.isPinned',    `ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false`],
  ['Announcement.section',     `ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "section" TEXT NOT NULL DEFAULT 'NEWS'`],
  ['Announcement.bannerUrl',   `ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT`],
  ['Announcement.content',     `ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "content" TEXT`],
  ['Event.isRegistrable',      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "isRegistrable" BOOLEAN NOT NULL DEFAULT false`],
  ['Event.availableSeats',     `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "availableSeats" INTEGER`],
  ['Event.registrations',      `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "registrations" INTEGER NOT NULL DEFAULT 0`],
  ['table EventRegistration', `CREATE TABLE IF NOT EXISTS "EventRegistration" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,"eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,"userId" TEXT NOT NULL REFERENCES "User"("id"),"registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE("eventId","userId"))`],
  // Indici
  ['index UserProgress.viewedAt', `CREATE INDEX IF NOT EXISTS "UserProgress_viewedAt" ON "UserProgress"("userId","viewedAt")`],
  ['index Announcement.isPinned', `CREATE INDEX IF NOT EXISTS "Ann_isPinned" ON "Announcement"("isPinned","published")`],
  ['index Announcement.section',  `CREATE INDEX IF NOT EXISTS "Ann_section" ON "Announcement"("section","published")`],
]

async function main() {
  console.log('\n🔧  Serviform Academy — Migrazione completa\n')
  let ok = 0; let skip = 0; let fail = 0
  for (const [name, sql] of steps) {
    try {
      await prisma.$executeRawUnsafe(sql.trim())
      console.log(`  ✅  ${name}`); ok++
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
        console.log(`  ⏭   ${name}`); skip++
      } else {
        console.error(`  ❌  ${name}: ${e.message?.split('\n')[0]}`); fail++
      }
    }
  }
  console.log(`\n✅  ${ok} applicati | ⏭ ${skip} già presenti | ❌ ${fail} errori`)
  console.log('\n📋  Prossimo: npx prisma generate && npx ts-node prisma/scripts/create-admin.ts\n')
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
