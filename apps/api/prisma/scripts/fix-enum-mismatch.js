/**
 * fix-enum-mismatch.js
 *
 * Script Node.js per applicare la migration direttamente tramite il client Prisma.
 * Usare questo script su Windows se psql non è installato.
 *
 * ESEGUIRE DA: apps/api/
 *   node prisma/scripts/fix-enum-mismatch.js
 *
 * Oppure:
 *   cd apps/api
 *   npx ts-node prisma/scripts/fix-enum-mismatch.ts
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n🔧 Serviform Academy — Fix enum mismatch\n')

  // ── Step 1: Rimuovi colonna "colonna" se esiste ──────────────────────────
  console.log('Step 1: Verifica colonna "colonna" su tabella User...')
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'User' AND column_name = 'colonna'
        ) THEN
          ALTER TABLE "User" DROP COLUMN "colonna";
          RAISE NOTICE 'Colonna "colonna" rimossa';
        END IF;
      END $$;
    `)
    console.log('  ✓ Step 1 completato')
  } catch (e) {
    console.log('  ⚠ Step 1 warning (non bloccante):', e.message)
  }

  // ── Step 2: Converti publishState a TEXT ─────────────────────────────────
  console.log('Step 2: Converto publishState a TEXT...')
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE col_type text;
      BEGIN
        SELECT udt_name INTO col_type
        FROM information_schema.columns
        WHERE table_name = 'Course' AND column_name = 'publishState';

        IF col_type IS NOT NULL AND col_type != 'text' AND col_type != 'varchar' THEN
          EXECUTE 'ALTER TABLE "Course" ALTER COLUMN "publishState" TYPE TEXT USING "publishState"::TEXT';
          RAISE NOTICE 'publishState convertita a TEXT da tipo: %', col_type;
        ELSE
          RAISE NOTICE 'publishState già TEXT o non trovata: %', COALESCE(col_type, 'N/A');
        END IF;
      END $$;
    `)
    console.log('  ✓ Step 2 completato')
  } catch (e) {
    console.log('  ⚠ Step 2 warning:', e.message)
  }

  // ── Step 3: Crea enum PublishState se non esiste ──────────────────────────
  console.log('Step 3: Creo enum PublishState...')
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PublishState') THEN
          CREATE TYPE "PublishState" AS ENUM ('HIDDEN', 'VISIBLE_LOCKED', 'PUBLISHED');
          RAISE NOTICE 'Enum PublishState creato';
        ELSE
          RAISE NOTICE 'Enum PublishState già esistente';
        END IF;
      END $$;
    `)
    console.log('  ✓ Step 3 completato')
  } catch (e) {
    console.log('  ⚠ Step 3 warning:', e.message)
  }

  // ── Step 4: Normalizza valori e riconverti al tipo enum ──────────────────
  console.log('Step 4: Normalizzo valori e riconverto a PublishState enum...')
  try {
    // Prima: normalizza valori non validi
    await prisma.$executeRawUnsafe(`
      UPDATE "Course"
      SET "publishState" = 'PUBLISHED'
      WHERE "publishState" NOT IN ('HIDDEN', 'VISIBLE_LOCKED', 'PUBLISHED')
         OR "publishState" IS NULL;
    `)
    // Poi: riconverti
    await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE col_type text;
      BEGIN
        SELECT udt_name INTO col_type
        FROM information_schema.columns
        WHERE table_name = 'Course' AND column_name = 'publishState';

        IF col_type = 'text' OR col_type = 'varchar' THEN
          EXECUTE 'ALTER TABLE "Course" ALTER COLUMN "publishState" TYPE "PublishState" USING "publishState"::"PublishState"';
          RAISE NOTICE 'publishState riconvertita a PublishState enum';
        ELSE
          RAISE NOTICE 'publishState non è TEXT (tipo: %), skip', col_type;
        END IF;
      END $$;
    `)
    console.log('  ✓ Step 4 completato')
  } catch (e) {
    console.log('  ⚠ Step 4 warning:', e.message)
  }

  // ── Step 5: Rimuovi enum obsoleto ────────────────────────────────────────
  console.log('Step 5: Rimuovo enum CoursePublishState obsoleto...')
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CoursePublishState') THEN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns WHERE udt_name = 'CoursePublishState'
          ) THEN
            DROP TYPE "CoursePublishState";
            RAISE NOTICE 'CoursePublishState rimosso';
          ELSE
            RAISE NOTICE 'CoursePublishState ancora in uso, non rimosso';
          END IF;
        END IF;
      END $$;
    `)
    console.log('  ✓ Step 5 completato')
  } catch (e) {
    console.log('  ⚠ Step 5 warning (non bloccante):', e.message)
  }

  // ── Verifica finale ───────────────────────────────────────────────────────
  console.log('\nVerifica finale...')
  const result = await prisma.$queryRaw`
    SELECT udt_name as tipo
    FROM information_schema.columns
    WHERE table_name = 'Course' AND column_name = 'publishState'
  `
  console.log('  publishState tipo attuale:', result)

  const colonnaCheck = await prisma.$queryRaw`
    SELECT COUNT(*) as n
    FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'colonna'
  `
  console.log('  Colonna "colonna" su User:', colonnaCheck[0]?.n === '0' ? '✓ non esiste (corretto)' : '⚠ esiste ancora')

  console.log('\n✅ Migration completata!\n')
  console.log('Prossimi passi:')
  console.log('  1. cd apps/api && npx prisma generate')
  console.log('  2. pnpm start:dev\n')
}

main()
  .catch(e => { console.error('❌ Errore:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
