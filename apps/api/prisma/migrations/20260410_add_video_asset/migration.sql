-- Migration: add_video_asset
-- Aggiunge il catalogo VideoAsset (file MP4/video caricati manualmente)
-- e rende GuideReference 1:N per unità (aggiunge colonna order, rimuove vincolo unique)

-- 1. Catalogo video
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

-- 2. GuideReference: aggiungi colonna order (se non esiste già)
ALTER TABLE "GuideReference" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- 3. Rimuovi il vincolo UNIQUE su unitId (da 1:1 a 1:N, se esiste)
ALTER TABLE "GuideReference" DROP CONSTRAINT IF EXISTS "GuideReference_unitId_key";

-- 4. Indice per performance su unitId (non unique)
CREATE INDEX IF NOT EXISTS "GuideReference_unitId_idx" ON "GuideReference"("unitId");
