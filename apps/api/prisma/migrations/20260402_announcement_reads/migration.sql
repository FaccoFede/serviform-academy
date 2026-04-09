-- ──────────────────────────────────────────────────────────────────────────
-- Migration: 20260402_announcement_reads
-- Aggiunge tabella AnnouncementRead per il tracking lettura comunicazioni.
-- Idempotente: sicura da rieseguire più volte.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "AnnouncementRead" (
  "id"             TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "announcementId" TEXT NOT NULL REFERENCES "Announcement"("id") ON DELETE CASCADE,
  "userId"         TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "readAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("announcementId", "userId")
);

CREATE INDEX IF NOT EXISTS "AnnouncementRead_userId_idx"
  ON "AnnouncementRead"("userId");

CREATE INDEX IF NOT EXISTS "AnnouncementRead_announcementId_idx"
  ON "AnnouncementRead"("announcementId");
