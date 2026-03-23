-- V2 Evolution: Exercise, Event, PricingPackage + schema updates

-- User fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'TEAM_ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'USER';

-- Software fields
ALTER TABLE "Software" ADD COLUMN IF NOT EXISTS "tagline" TEXT;
ALTER TABLE "Software" ADD COLUMN IF NOT EXISTS "color" TEXT;
ALTER TABLE "Software" ADD COLUMN IF NOT EXISTS "lightColor" TEXT;
ALTER TABLE "Software" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Course fields
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "level" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "duration" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "available" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Unit fields: content as rich HTML text
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "subtitle" TEXT;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "duration" TEXT;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "content" TEXT;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
DO $$ BEGIN CREATE TYPE "UnitType" AS ENUM ('OVERVIEW', 'LESSON', 'EXERCISE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "unitType" "UnitType" NOT NULL DEFAULT 'LESSON';

-- Exercise table
CREATE TABLE IF NOT EXISTS "Exercise" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT,
  "htmlUrl" TEXT, "evdUrl" TEXT, "order" INTEGER NOT NULL DEFAULT 0,
  "unitId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Exercise" DROP CONSTRAINT IF EXISTS "Exercise_unitId_fkey";
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Event table
DO $$ BEGIN CREATE TYPE "EventType" AS ENUM ('WORKSHOP', 'WEBINAR', 'LIVE_SESSION'); EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE TABLE IF NOT EXISTS "Event" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT,
  "eventType" "EventType" NOT NULL DEFAULT 'WEBINAR',
  "date" TIMESTAMP(3) NOT NULL, "endDate" TIMESTAMP(3),
  "location" TEXT, "maxSeats" INTEGER,
  "registrationUrl" TEXT, "recordingUrl" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- PricingPackage table
CREATE TABLE IF NOT EXISTS "PricingPackage" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "description" TEXT, "price" TEXT, "priceNote" TEXT,
  "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "highlighted" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PricingPackage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PricingPackage_slug_key" ON "PricingPackage"("slug");

-- Index
CREATE INDEX IF NOT EXISTS "UserProgress_userId_completed_idx" ON "UserProgress" ("userId", "completed");
