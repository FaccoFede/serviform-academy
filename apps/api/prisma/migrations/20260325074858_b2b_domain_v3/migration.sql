-- =============================================================================
-- Migration: 20260325074858_b2b_domain_v3  (VERSIONE CORRETTA - idempotente)
-- Sostituisce la versione originale che falliva sul shadow database Prisma
-- perché AnnouncementType era già creato dalla migrazione precedente.
--
-- TUTTE le CREATE TYPE usano DO $$ ... EXCEPTION WHEN duplicate_object
-- TUTTE le CREATE TABLE usano IF NOT EXISTS
-- TUTTE le ALTER TABLE usano ADD COLUMN IF NOT EXISTS
-- =============================================================================

-- ── Enum: CoursePublishState ──────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "CoursePublishState" AS ENUM ('HIDDEN', 'VISIBLE_LOCKED', 'PUBLISHED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Enum: CourseAccessType ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "CourseAccessType" AS ENUM ('ACTIVE', 'LOCKED', 'HIDDEN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Enum: AnnouncementType (già esistente dalla migrazione precedente) ─────────
DO $$ BEGIN
  CREATE TYPE "AnnouncementType" AS ENUM ('NEWS', 'NEW_COURSE', 'WEBINAR', 'MAINTENANCE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Enum: CsvImportType ───────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "CsvImportType" AS ENUM ('COMPANIES', 'USERS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Enum: CsvImportStatus ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "CsvImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── VideoPill FK (drop e ricrea in modo sicuro) ───────────────────────────────
DO $$ BEGIN
  ALTER TABLE "VideoPill" DROP CONSTRAINT IF EXISTS "VideoPill_softwareId_fkey";
EXCEPTION WHEN undefined_object THEN null; END $$;

-- ── Course: nuovi campi ───────────────────────────────────────────────────────
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "objective" TEXT;

-- publishState: aggiunge la colonna solo se non esiste,
-- poi migra il tipo da CoursePublishState se necessario
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Course' AND column_name = 'publishState'
  ) THEN
    ALTER TABLE "Course" ADD COLUMN "publishState" "CoursePublishState" NOT NULL DEFAULT 'PUBLISHED';
  END IF;
END $$;

-- ── Unit: nuovi campi ─────────────────────────────────────────────────────────
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;

-- ── User: nuovi campi ─────────────────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName"  TEXT;

-- ── UserProgress: nuovi campi ─────────────────────────────────────────────────
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP(3);

-- ── Company ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Company" (
    "id"                  TEXT          NOT NULL,
    "name"                TEXT          NOT NULL,
    "slug"                TEXT          NOT NULL,
    "contractType"        TEXT,
    "assistanceExpiresAt" TIMESTAMP(3),
    "notes"               TEXT,
    "createdAt"           TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"           TIMESTAMP(3),
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Company_slug_key" ON "Company"("slug");

-- ── CompanyInterest ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CompanyInterest" (
    "id"         TEXT NOT NULL,
    "companyId"  TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    CONSTRAINT "CompanyInterest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyInterest_companyId_softwareId_key"
    ON "CompanyInterest"("companyId", "softwareId");

-- ── CompanyMembership ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CompanyMembership" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "companyId" TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyMembership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyMembership_userId_key" ON "CompanyMembership"("userId");

-- ── CompanyCourseAssignment ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CompanyCourseAssignment" (
    "id"         TEXT         NOT NULL,
    "companyId"  TEXT         NOT NULL,
    "courseId"   TEXT         NOT NULL,
    "accessType" TEXT         NOT NULL DEFAULT 'ACTIVE',
    "startsAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"  TIMESTAMP(3),
    "notes"      TEXT,
    "createdBy"  TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyCourseAssignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CompanyCourseAssignment_companyId_idx"
    ON "CompanyCourseAssignment"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyCourseAssignment_expiresAt_idx"
    ON "CompanyCourseAssignment"("expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyCourseAssignment_companyId_courseId_key"
    ON "CompanyCourseAssignment"("companyId", "courseId");

-- ── UserCourseAssignment ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "UserCourseAssignment" (
    "id"         TEXT         NOT NULL,
    "userId"     TEXT         NOT NULL,
    "courseId"   TEXT         NOT NULL,
    "accessType" TEXT         NOT NULL DEFAULT 'ACTIVE',
    "startsAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"  TIMESTAMP(3),
    "notes"      TEXT,
    "createdBy"  TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserCourseAssignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "UserCourseAssignment_userId_idx"
    ON "UserCourseAssignment"("userId");
CREATE INDEX IF NOT EXISTS "UserCourseAssignment_expiresAt_idx"
    ON "UserCourseAssignment"("expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "UserCourseAssignment_userId_courseId_key"
    ON "UserCourseAssignment"("userId", "courseId");

-- ── UnitFeedback ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "UnitFeedback" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "unitId"    TEXT         NOT NULL,
    "useful"    BOOLEAN      NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UnitFeedback_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UnitFeedback_userId_unitId_key"
    ON "UnitFeedback"("userId", "unitId");

-- ── CourseFeedback ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CourseFeedback" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "courseId"  TEXT         NOT NULL,
    "rating"    INTEGER      NOT NULL,
    "comment"   TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseFeedback_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CourseFeedback_userId_courseId_key"
    ON "CourseFeedback"("userId", "courseId");

-- ── Announcement ──────────────────────────────────────────────────────────────
-- La tabella potrebbe già esistere dalla migrazione precedente (20260325_b2b_features)
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id"          TEXT         NOT NULL,
    "title"       TEXT         NOT NULL,
    "body"        TEXT         NOT NULL,
    "type"        "AnnouncementType" NOT NULL DEFAULT 'NEWS',
    "published"   BOOLEAN      NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "expiresAt"   TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy"   TEXT,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- ── CsvImportJob ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CsvImportJob" (
    "id"          TEXT             NOT NULL,
    "type"        "CsvImportType"  NOT NULL,
    "status"      "CsvImportStatus" NOT NULL DEFAULT 'PENDING',
    "filename"    TEXT             NOT NULL,
    "totalRows"   INTEGER          NOT NULL DEFAULT 0,
    "imported"    INTEGER          NOT NULL DEFAULT 0,
    "failed"      INTEGER          NOT NULL DEFAULT 0,
    "errors"      JSONB,
    "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdBy"   TEXT,
    CONSTRAINT "CsvImportJob_pkey" PRIMARY KEY ("id")
);

-- ── Foreign Keys (solo se non esistono già) ───────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "CompanyInterest"
    ADD CONSTRAINT "CompanyInterest_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "CompanyInterest"
    ADD CONSTRAINT "CompanyInterest_softwareId_fkey"
    FOREIGN KEY ("softwareId") REFERENCES "Software"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "CompanyMembership"
    ADD CONSTRAINT "CompanyMembership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "CompanyMembership"
    ADD CONSTRAINT "CompanyMembership_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "CompanyCourseAssignment"
    ADD CONSTRAINT "CompanyCourseAssignment_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "CompanyCourseAssignment"
    ADD CONSTRAINT "CompanyCourseAssignment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "UserCourseAssignment"
    ADD CONSTRAINT "UserCourseAssignment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "UserCourseAssignment"
    ADD CONSTRAINT "UserCourseAssignment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "UnitFeedback"
    ADD CONSTRAINT "UnitFeedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "UnitFeedback"
    ADD CONSTRAINT "UnitFeedback_unitId_fkey"
    FOREIGN KEY ("unitId") REFERENCES "Unit"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "CourseFeedback"
    ADD CONSTRAINT "CourseFeedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "CourseFeedback"
    ADD CONSTRAINT "CourseFeedback_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "VideoPill"
    ADD CONSTRAINT "VideoPill_softwareId_fkey"
    FOREIGN KEY ("softwareId") REFERENCES "Software"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Indici utili ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "UserProgress_viewedAt"
    ON "UserProgress"("userId", "viewedAt");
