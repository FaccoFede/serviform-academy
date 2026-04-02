// run-migration.js — mettilo in apps/api/ ed esegui: node run-migration.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function step(name, fn) {
  process.stdout.write(name + '... ')
  try { await fn(); console.log('✓') }
  catch (e) { console.log('⚠ ' + e.message.split('\n')[0]) }
}

async function main() {
  console.log('\n── Fix DB ──\n')

  await step('Rimuovi colonna "colonna" da User', () => prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='colonna')
      THEN ALTER TABLE "User" DROP COLUMN "colonna"; END IF;
    END $$`))

  await step('Converti publishState a TEXT', () => prisma.$executeRawUnsafe(`
    DO $$ DECLARE t text; BEGIN
      SELECT udt_name INTO t FROM information_schema.columns WHERE table_name='Course' AND column_name='publishState';
      IF t IS NOT NULL AND t NOT IN ('text','varchar')
      THEN EXECUTE 'ALTER TABLE "Course" ALTER COLUMN "publishState" TYPE TEXT USING "publishState"::TEXT'; END IF;
    END $$`))

  await step('Crea enum PublishState', () => prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='PublishState')
      THEN CREATE TYPE "PublishState" AS ENUM ('HIDDEN','VISIBLE_LOCKED','PUBLISHED'); END IF;
    END $$`))

  await step('Normalizza valori', () => prisma.$executeRawUnsafe(`
    UPDATE "Course" SET "publishState"='PUBLISHED'
    WHERE "publishState" NOT IN ('HIDDEN','VISIBLE_LOCKED','PUBLISHED') OR "publishState" IS NULL`))

  await step('Riconverti a PublishState enum', () => prisma.$executeRawUnsafe(`
    DO $$ DECLARE t text; BEGIN
      SELECT udt_name INTO t FROM information_schema.columns WHERE table_name='Course' AND column_name='publishState';
      IF t IN ('text','varchar')
      THEN EXECUTE 'ALTER TABLE "Course" ALTER COLUMN "publishState" TYPE "PublishState" USING "publishState"::"PublishState"'; END IF;
    END $$`))

  await step('Rimuovi CoursePublishState obsoleto', () => prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname='CoursePublishState')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE udt_name='CoursePublishState')
      THEN DROP TYPE "CoursePublishState"; END IF;
    END $$`))

  const [ps] = await prisma.$queryRaw`SELECT udt_name as t FROM information_schema.columns WHERE table_name='Course' AND column_name='publishState'`
  console.log('\npublishState tipo finale:', ps?.t === 'PublishState' ? '✓ PublishState' : '⚠ ' + ps?.t)
  console.log('\n✅ Fatto! Ora: npx prisma generate && pnpm start:dev\n')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) }).finally(() => prisma.$disconnect())
