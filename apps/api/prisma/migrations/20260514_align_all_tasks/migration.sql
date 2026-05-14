-- Migration: 20260514_align_all_tasks
-- Allinea la migration history con tutte le modifiche apportate dai task
-- TASK-01 → TASK-06-QUATER che non erano state catturate in migration precedenti.

-- ── TASK-01: Rimozione filtro software per azienda ─────────────────────────
ALTER TABLE "Company" DROP COLUMN IF EXISTS "visibleSoftwareIds";
DROP TABLE IF EXISTS "CompanyInterest";

-- ── TASK-04: Rimozione campi contratto/assistenza da Company ───────────────
ALTER TABLE "Company" DROP COLUMN IF EXISTS "contractType";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "assistanceExpiresAt";

-- ── TASK-05: Badge URL su Course ───────────────────────────────────────────
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "badgeUrl" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "issuesBadge" BOOLEAN NOT NULL DEFAULT true;

-- ── TASK-06: Banner URL su Event ───────────────────────────────────────────
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;

-- ── TASK-06-BIS: Aggiornamento valori section Announcement ────────────────
ALTER TABLE "Announcement" ALTER COLUMN "section" SET DEFAULT 'COMUNICAZIONE';
UPDATE "Announcement" SET "section" = 'COMUNICAZIONE' WHERE "section" IN ('NEWS', 'PRESS', 'RULES');
UPDATE "Announcement" SET "section" = 'EVENTO'        WHERE "section" = 'EVENTS';

-- ── TASK-06-QUATER: Rimozione isPinned da Announcement ────────────────────
ALTER TABLE "Announcement" DROP COLUMN IF EXISTS "isPinned";
