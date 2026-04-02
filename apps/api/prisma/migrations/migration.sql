-- =============================================================
-- Migration: video_catalog_and_multi_guides
-- Aggiunge il catalogo video e rende GuideReference 1:N per unità
-- =============================================================

-- 1. Catalogo video (file MP4 caricati)
CREATE TABLE IF NOT EXISTS "VideoAsset" (
  "id"        TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title"     TEXT         NOT NULL,
  "filename"  TEXT         NOT NULL,
  "url"       TEXT         NOT NULL,
  "size"      INTEGER,
  "mimeType"  TEXT         NOT NULL DEFAULT 'video/mp4',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. GuideReference: rimuovi il vincolo UNIQUE su unitId (da 1:1 a 1:N)
--    Prima aggiungi la colonna order se non esiste
ALTER TABLE "GuideReference" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- Rimuovi il vincolo unique esistente
ALTER TABLE "GuideReference" DROP CONSTRAINT IF EXISTS "GuideReference_unitId_key";

-- L'indice per performance rimane (non unique)
CREATE INDEX IF NOT EXISTS "GuideReference_unitId_idx" ON "GuideReference"("unitId");
