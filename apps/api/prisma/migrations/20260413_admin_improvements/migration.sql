-- Admin panel improvements
-- 1. Company.visibleSoftwareIds: filtro visibilità contenuti per azienda
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "visibleSoftwareIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. Course.issuesBadge: abilita rilascio certificato/badge al completamento
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "issuesBadge" BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. Unit.durationHours / durationMinutes: gestione durata senza stringhe manuali
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "durationHours" INTEGER;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER;

-- 4. GuideReference.catalogId: collegamento al catalogo guide
ALTER TABLE "GuideReference" ADD COLUMN IF NOT EXISTS "catalogId" TEXT;

-- 5. GuideCatalog: nuovo modello catalogo guide Zendesk
CREATE TABLE IF NOT EXISTS "GuideCatalog" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "zendeskId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuideCatalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GuideCatalog_url_key" ON "GuideCatalog"("url");

-- 6. FK GuideReference.catalogId → GuideCatalog.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'GuideReference_catalogId_fkey'
  ) THEN
    ALTER TABLE "GuideReference"
      ADD CONSTRAINT "GuideReference_catalogId_fkey"
      FOREIGN KEY ("catalogId") REFERENCES "GuideCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;
