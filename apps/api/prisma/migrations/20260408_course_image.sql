-- ── Migration: add imageUrl to Course ─────────────────────────────────────
-- File: apps/api/prisma/migrations/20260408_course_image/migration.sql
--
-- Aggiunge il campo `imageUrl` opzionale al modello Course.
-- Questo campo viene usato dal catalogo per mostrare l'anteprima del corso.
--
-- Dimensioni immagine raccomandate:
--   Width: 800px | Height: 200px | Ratio: 4:1
--   Formato: JPG o WebP | Peso max: 200KB
--
-- Il campo è opzionale (NULL): le card mostrano il placeholder brand
-- quando imageUrl è NULL.
--
-- ESECUZIONE:
--   cd apps/api
--   npx prisma migrate dev --name add_course_image
-- oppure direttamente:
--   psql $DATABASE_URL -f this_file.sql
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Indice non necessario (non è un campo di ricerca), ma il commento
-- documenta la politica di archiviazione delle immagini.
-- Le immagini devono essere servite da un CDN/storage remoto:
--   - Supabase Storage: https://[project].supabase.co/storage/v1/object/public/...
--   - Cloudinary:       https://res.cloudinary.com/[account]/image/upload/...
--   - S3/CloudFront:    https://[bucket].s3.amazonaws.com/...
-- NON salvare path locali (es. /uploads/...) nel campo imageUrl.
