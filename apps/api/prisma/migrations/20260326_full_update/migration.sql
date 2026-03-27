-- Full Update Migration — Serviform Academy
-- Sicura da rieseguire con IF NOT EXISTS

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "isPinned"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "section"    TEXT NOT NULL DEFAULT 'NEWS';
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "bannerUrl"  TEXT;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "content"    TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "isRegistrable"    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "availableSeats"   INTEGER;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "registrations"    INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "EventRegistration" (
  "id"           TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "eventId"      TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "userId"       TEXT NOT NULL REFERENCES "User"("id"),
  "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("eventId","userId")
);

CREATE INDEX IF NOT EXISTS "Ann_isPinned" ON "Announcement"("isPinned","published");
CREATE INDEX IF NOT EXISTS "Ann_section"  ON "Announcement"("section","published");
