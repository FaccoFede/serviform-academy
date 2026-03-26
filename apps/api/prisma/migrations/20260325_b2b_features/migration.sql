-- B2B Features Migration: Company, Announcements, Assignments, videoUrl, viewedAt
-- Usa IF NOT EXISTS / DO$$ ovunque — sicura da rieseguire

-- ── User: nuovi campi ────────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;

-- ── Unit: videoUrl ───────────────────────────────────────────────────
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;

-- ── UserProgress: viewedAt ───────────────────────────────────────────
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP(3);

-- ── Course: publishState ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "PublishState" AS ENUM ('HIDDEN', 'VISIBLE_LOCKED', 'PUBLISHED');
EXCEPTION WHEN duplicate_object THEN null; END $$;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "publishState" "PublishState" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "objective" TEXT;

-- ── AccessType enum ──────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "AccessType" AS ENUM ('ACTIVE', 'LOCKED', 'HIDDEN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Company ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Company" (
  "id"                  TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"                TEXT NOT NULL,
  "slug"                TEXT NOT NULL UNIQUE,
  "contractType"        TEXT,
  "assistanceExpiresAt" TIMESTAMP(3),
  "notes"               TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"           TIMESTAMP(3)
);

-- ── CompanyMembership ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CompanyMembership" (
  "id"        TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL UNIQUE REFERENCES "User"("id"),
  "companyId" TEXT NOT NULL REFERENCES "Company"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── CompanyInterest ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CompanyInterest" (
  "id"         TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId"  TEXT NOT NULL REFERENCES "Company"("id"),
  "softwareId" TEXT NOT NULL REFERENCES "Software"("id"),
  UNIQUE("companyId","softwareId")
);

-- ── CompanyCourseAssignment ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CompanyCourseAssignment" (
  "id"         TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId"  TEXT NOT NULL REFERENCES "Company"("id"),
  "courseId"   TEXT NOT NULL REFERENCES "Course"("id"),
  "accessType" "AccessType" NOT NULL DEFAULT 'ACTIVE',
  "startsAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"  TIMESTAMP(3),
  "notes"      TEXT,
  "createdBy"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("companyId","courseId")
);

-- ── UserCourseAssignment ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "UserCourseAssignment" (
  "id"         TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"     TEXT NOT NULL REFERENCES "User"("id"),
  "courseId"   TEXT NOT NULL REFERENCES "Course"("id"),
  "accessType" "AccessType" NOT NULL DEFAULT 'ACTIVE',
  "startsAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"  TIMESTAMP(3),
  "notes"      TEXT,
  "createdBy"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId","courseId")
);

-- ── AnnouncementType enum ────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "AnnouncementType" AS ENUM ('NEWS','NEW_COURSE','WEBINAR','MAINTENANCE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Announcement ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Announcement" (
  "id"          TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title"       TEXT NOT NULL,
  "body"        TEXT NOT NULL,
  "type"        "AnnouncementType" NOT NULL DEFAULT 'NEWS',
  "published"   BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "expiresAt"   TIMESTAMP(3),
  "createdBy"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Indici utili ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "UserProgress_viewedAt" ON "UserProgress"("userId","viewedAt");
