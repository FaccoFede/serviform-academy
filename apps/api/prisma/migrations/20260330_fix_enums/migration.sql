-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: fix_enum_mismatch
-- Data: 2026-03-30
-- Motivo:
--   1. Il campo "colonna" non esiste nel DB ma veniva referenziato da Prisma
--      → causava: "The column `colonna` does not exist in the current database"
--
--   2. La colonna "publishState" su Course usa il tipo "CoursePublishState"
--      ma lo schema Prisma dichiara il tipo "PublishState"
--      → causava: error code 42804 "tipo incompatibile"
--
-- Questa migration:
--   a) Rimuove la colonna "colonna" se esiste (pulizia)
--   b) Ridenomina l'enum CoursePublishState → PublishState se necessario
--      (o crea PublishState e migra i valori se non esiste ancora)
--
-- È SICURA DA RIESEGUIRE: usa IF EXISTS / DO$$ ovunque.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Rimuovi colonna "colonna" se esiste ────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'colonna'
  ) THEN
    ALTER TABLE "User" DROP COLUMN "colonna";
    RAISE NOTICE 'Colonna "colonna" rimossa da User';
  ELSE
    RAISE NOTICE 'Colonna "colonna" non presente, skip';
  END IF;
END $$;

-- ── 2. Fix enum publishState su Course ────────────────────────────────────
-- Strategia: convertiamo la colonna a TEXT, droppiamo l'enum obsoleto,
-- creiamo l'enum corretto, riconvertiamo.
-- Questo evita qualsiasi problema con nomi enum duplicati o incompatibili.

DO $$
DECLARE
  col_type text;
BEGIN
  -- Legge il tipo attuale della colonna publishState su Course
  SELECT udt_name INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'Course' AND column_name = 'publishState';

  IF col_type IS NULL THEN
    RAISE NOTICE 'Colonna publishState non trovata su Course, skip';
    RETURN;
  END IF;

  RAISE NOTICE 'Tipo attuale di publishState: %', col_type;

  -- Se il tipo è già "PublishState" (corretto), non fare nulla
  IF col_type = 'PublishState' THEN
    RAISE NOTICE 'Enum già corretto (PublishState), skip';
    RETURN;
  END IF;

  -- Converti la colonna a TEXT preservando i valori
  EXECUTE 'ALTER TABLE "Course" ALTER COLUMN "publishState" TYPE TEXT USING "publishState"::TEXT';
  RAISE NOTICE 'Colonna publishState convertita a TEXT';

END $$;

-- Crea l'enum PublishState se non esiste
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PublishState') THEN
    CREATE TYPE "PublishState" AS ENUM ('HIDDEN', 'VISIBLE_LOCKED', 'PUBLISHED');
    RAISE NOTICE 'Enum PublishState creato';
  ELSE
    RAISE NOTICE 'Enum PublishState già esistente';
  END IF;
END $$;

-- Riconverti la colonna al tipo corretto PublishState
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT udt_name INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'Course' AND column_name = 'publishState';

  IF col_type = 'text' OR col_type = 'varchar' THEN
    -- Assicura che i valori esistenti siano validi prima della conversione
    UPDATE "Course"
    SET "publishState" = 'PUBLISHED'
    WHERE "publishState" NOT IN ('HIDDEN', 'VISIBLE_LOCKED', 'PUBLISHED')
       OR "publishState" IS NULL;

    EXECUTE 'ALTER TABLE "Course" ALTER COLUMN "publishState" TYPE "PublishState" USING "publishState"::"PublishState"';
    RAISE NOTICE 'Colonna publishState riconvertita a PublishState enum';
  END IF;
END $$;

-- Rimuovi l'enum obsoleto CoursePublishState se esiste e non è più usato
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CoursePublishState') THEN
    -- Verifica che non sia più usato da nessuna colonna
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE udt_name = 'CoursePublishState'
    ) THEN
      DROP TYPE "CoursePublishState";
      RAISE NOTICE 'Enum CoursePublishState obsoleto rimosso';
    ELSE
      RAISE NOTICE 'CoursePublishState ancora in uso, non rimosso';
    END IF;
  END IF;
END $$;

-- ── 3. Verifica finale ────────────────────────────────────────────────────
DO $$
DECLARE
  ps_type text;
BEGIN
  SELECT udt_name INTO ps_type
  FROM information_schema.columns
  WHERE table_name = 'Course' AND column_name = 'publishState';
  RAISE NOTICE 'Stato finale publishState: tipo = %', COALESCE(ps_type, 'NON TROVATA');
END $$;
