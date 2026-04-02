-- ============================================================
-- FIX FINALE — Serviform Academy
-- Esegui questo script in psql o pgAdmin PRIMA di db push
-- ============================================================
-- Il problema: il DB ha CourseAccessType e CoursePublishState
-- Lo schema Prisma si aspetta AccessType e PublishState
-- Soluzione: convertiamo le colonne a TEXT, droppiamo gli enum
-- vecchi, e lasciamo che Prisma usi gli enum già presenti.
-- ============================================================

-- 1. Rimuovi i DEFAULT che dipendono da CourseAccessType
ALTER TABLE "CompanyCourseAssignment"
  ALTER COLUMN "accessType" DROP DEFAULT;

ALTER TABLE "UserCourseAssignment"
  ALTER COLUMN "accessType" DROP DEFAULT;

-- 2. Converti le colonne accessType da CourseAccessType a TEXT
ALTER TABLE "CompanyCourseAssignment"
  ALTER COLUMN "accessType" TYPE TEXT
  USING "accessType"::text;

ALTER TABLE "UserCourseAssignment"
  ALTER COLUMN "accessType" TYPE TEXT
  USING "accessType"::text;

-- 3. Rimetti il DEFAULT come stringa
ALTER TABLE "CompanyCourseAssignment"
  ALTER COLUMN "accessType" SET DEFAULT 'ACTIVE';

ALTER TABLE "UserCourseAssignment"
  ALTER COLUMN "accessType" SET DEFAULT 'ACTIVE';

-- 4. Ora possiamo eliminare CourseAccessType in sicurezza
DROP TYPE IF EXISTS "CourseAccessType";

-- 5. Converti publishState da CoursePublishState a PublishState
--    Prima rimuovi il default
ALTER TABLE "Course"
  ALTER COLUMN "publishState" DROP DEFAULT;

--    Converti a TEXT
ALTER TABLE "Course"
  ALTER COLUMN "publishState" TYPE TEXT
  USING "publishState"::text;

--    Riconverti a PublishState (enum già esistente)
ALTER TABLE "Course"
  ALTER COLUMN "publishState" TYPE "PublishState"
  USING "publishState"::"PublishState";

--    Rimetti il default
ALTER TABLE "Course"
  ALTER COLUMN "publishState" SET DEFAULT 'PUBLISHED'::"PublishState";

--    Elimina il vecchio enum
DROP TYPE IF EXISTS "CoursePublishState";

-- 6. Allinea CompanyMembership (il DB ha joinedAt, lo schema ha createdAt)
--    Aggiungi createdAt se manca
ALTER TABLE "CompanyMembership"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 7. Ripristina FK su VideoPill se mancante
DO $$ BEGIN
  ALTER TABLE "VideoPill"
    ADD CONSTRAINT "VideoPill_softwareId_fkey"
    FOREIGN KEY ("softwareId") REFERENCES "Software"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- Verifica finale: questi SELECT devono tornare 0 righe
-- ============================================================
-- SELECT typname FROM pg_type WHERE typname IN ('CourseAccessType','CoursePublishState');
-- (deve essere vuoto)
