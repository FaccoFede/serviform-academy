-- Fase 2+3: Evoluzione schema
-- Aggiunge campi per auth, content blocks, soft delete, metadata corsi

-- User: campi autenticazione e ruoli
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Crea enum Role se non esiste
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'TEAM_ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'USER';

-- Software: metadata aggiuntivi
ALTER TABLE "Software" ADD COLUMN IF NOT EXISTS "tagline" TEXT;
ALTER TABLE "Software" ADD COLUMN IF NOT EXISTS "color" TEXT;
ALTER TABLE "Software" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Course: metadata dal prototipo
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "level" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "duration" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "available" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Unit: content blocks e metadata
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "subtitle" TEXT;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "duration" TEXT;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "contentBlocks" JSONB;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Crea enum UnitType se non esiste
DO $$ BEGIN
  CREATE TYPE "UnitType" AS ENUM ('OVERVIEW', 'LESSON', 'EXERCISE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "unitType" "UnitType" NOT NULL DEFAULT 'LESSON';

-- Indice composto per query progresso
CREATE INDEX IF NOT EXISTS "UserProgress_userId_completed_idx"
  ON "UserProgress" ("userId", "completed");
