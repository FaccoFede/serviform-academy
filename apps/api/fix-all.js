/**
 * fix-all.js — Serviform Academy: Riparazione completa DB/Schema
 * ─────────────────────────────────────────────────────────────────
 * PERCORSO: apps/api/fix-all.js
 *
 * ⚠️  ERRORE "Cannot find module": il file DEVE essere nella cartella
 *     apps/api/ — NON nella root del monorepo.
 *
 * ESEGUIRE DA: apps/api/
 *   cd apps/api
 *   node fix-all.js
 *
 * Poi, dopo il completamento:
 *   npx prisma generate
 *   pnpm start:dev
 *
 * ─────────────────────────────────────────────────────────────────
 * COSA FA QUESTO SCRIPT
 * ─────────────────────────────────────────────────────────────────
 * Fase 0: Diagnosi — elenca colonne sospette e tipi enum
 * Fase 1: Rimozione colonna `colonna` da TUTTE le tabelle
 * Fase 2: Allineamento enum publishState (CoursePublishState → PublishState)
 * Fase 3: Allineamento accessType a TEXT puro
 * Fase 4: Aggiunta colonne mancanti previste dallo schema
 * Fase 5: Creazione indici per performance
 * Fase 6: Normalizzazione enum Role
 * Fase 7: Verifica finale e report
 *
 * ─────────────────────────────────────────────────────────────────
 * CAUSA ROOT DEGLI ERRORI
 * ─────────────────────────────────────────────────────────────────
 * Il campo `colonna` fu aggiunto PER ERRORE allo schema Prisma locale
 * (probabilmente durante un refactoring del modello User/Course).
 *
 * Quando è stato eseguito `npx prisma generate` con quello schema,
 * il Prisma Client generato ha iniziato a includere `colonna` in
 * TUTTE le query SELECT — anche su Course e UserProgress tramite le
 * relazioni transitive.
 *
 * Il database PostgreSQL non aveva mai avuto questa colonna, quindi
 * ogni query restituiva:
 *   PrismaClientKnownRequestError:
 *     The column `colonna` does not exist in the current database
 *
 * SOLUZIONE:
 *   1. node fix-all.js  ← rimuove colonna dal DB se presente
 *   2. npx prisma generate  ← rigenera il client da schema pulito
 *   3. pnpm start:dev  ← riavvia con il client corretto
 * ─────────────────────────────────────────────────────────────────
 */

// ── Verifica percorso ─────────────────────────────────────────────────────
const path = require('path')
const cwd  = process.cwd()
const expectedDir = 'apps' + path.sep + 'api'

if (!cwd.endsWith('apps' + path.sep + 'api') &&
    !cwd.endsWith('apps/api')) {
  console.error('\n❌  ERRORE: Eseguire questo script da apps/api/')
  console.error('   Attuale directory:', cwd)
  console.error('\n   Comandi corretti:')
  console.error('   cd apps/api')
  console.error('   node fix-all.js\n')
  process.exit(1)
}

// ── Dipendenze ────────────────────────────────────────────────────────────
let PrismaClient
try {
  PrismaClient = require('@prisma/client').PrismaClient
} catch {
  console.error('\n❌  @prisma/client non trovato.')
  console.error('   Esegui prima: pnpm install')
  process.exit(1)
}

const prisma = new PrismaClient()

// ── Colori console ────────────────────────────────────────────────────────
const G = '\x1b[32m'  // verde
const R = '\x1b[31m'  // rosso
const Y = '\x1b[33m'  // giallo
const B = '\x1b[36m'  // cyan
const X = '\x1b[0m'   // reset

/**
 * Esegue un SQL raw. Non lancia mai eccezione — logga warning.
 * @param {string} label - descrizione del passo (per il log)
 * @param {string} sql   - SQL da eseguire
 */
async function run(label, sql) {
  process.stdout.write(`  ${label}... `)
  try {
    await prisma.$executeRawUnsafe(sql.trim())
    console.log(`${G}✓${X}`)
    return true
  } catch (e) {
    const msg = e.message?.split('\n')[0] ?? e.message
    const isHarmless =
      msg.includes('already exists') ||
      msg.includes('does not exist') ||
      msg.includes('duplicate') ||
      msg.includes('non trovata')
    console.log(isHarmless ? `${Y}⏭ skip${X}` : `${R}⚠ ${msg}${X}`)
    return false
  }
}

/** Controlla se una colonna esiste in una tabella */
async function colExists(table, column) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = $1 AND column_name = $2`, table, column
    )
    return rows.length > 0
  } catch { return false }
}

/** Legge il tipo di una colonna */
async function colType(table, column) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT udt_name FROM information_schema.columns
       WHERE table_name = $1 AND column_name = $2`, table, column
    )
    return rows[0]?.udt_name ?? null
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${B}══ Serviform Academy — Fix DB Completo ══${X}\n`)

  // ── FASE 0: Diagnosi ──────────────────────────────────────────────────
  console.log(`${B}[0/7] Diagnosi database...${X}`)
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `
  console.log(`  Tabelle: ${tables.map(t => t.tablename).join(', ')}`)

  const colonnaIn = []
  for (const { tablename } of tables) {
    if (await colExists(tablename, 'colonna')) colonnaIn.push(tablename)
  }
  console.log(
    colonnaIn.length > 0
      ? `  ${R}⚠ campo "colonna" trovato in: ${colonnaIn.join(', ')}${X}`
      : `  ${G}✓ campo "colonna" non presente nel DB${X}`
  )

  const psType = await colType('Course', 'publishState')
  console.log(`  publishState su Course: ${psType ?? 'non trovata'}`)
  console.log()

  // ── FASE 1: Rimuovi "colonna" ─────────────────────────────────────────
  console.log(`${B}[1/7] Rimozione campo "colonna"...${X}`)
  const ALL_TABLES = [
    'User','Course','Unit','Software','UserProgress','Certificate',
    'CompanyMembership','Company','CompanyCourseAssignment',
    'UserCourseAssignment','Announcement','Event','VideoPill','PricingPackage',
  ]
  for (const t of ALL_TABLES) {
    if (await colExists(t, 'colonna')) {
      await run(`${t}.colonna DROP`, `ALTER TABLE "${t}" DROP COLUMN IF EXISTS "colonna"`)
    }
  }
  console.log()

  // ── FASE 2: Fix enum publishState ─────────────────────────────────────
  console.log(`${B}[2/7] Allineamento enum publishState su Course...${X}`)
  await run('publishState → TEXT', `
    DO $$ DECLARE t text; BEGIN
      SELECT udt_name INTO t FROM information_schema.columns
      WHERE table_name='Course' AND column_name='publishState';
      IF t IS NOT NULL AND t NOT IN ('text','varchar') THEN
        ALTER TABLE "Course" ALTER COLUMN "publishState" DROP DEFAULT;
        EXECUTE 'ALTER TABLE "Course" ALTER COLUMN "publishState" TYPE TEXT USING "publishState"::TEXT';
      END IF;
    END $$`)
  await run('Crea PublishState enum', `
    DO $$ BEGIN
      CREATE TYPE "PublishState" AS ENUM ('HIDDEN','VISIBLE_LOCKED','PUBLISHED');
    EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await run('Normalizza valori', `
    UPDATE "Course" SET "publishState"='PUBLISHED'
    WHERE "publishState" IS NULL
       OR "publishState" NOT IN ('HIDDEN','VISIBLE_LOCKED','PUBLISHED')`)
  await run('publishState → PublishState', `
    DO $$ DECLARE t text; BEGIN
      SELECT udt_name INTO t FROM information_schema.columns
      WHERE table_name='Course' AND column_name='publishState';
      IF t IN ('text','varchar') THEN
        EXECUTE 'ALTER TABLE "Course" ALTER COLUMN "publishState" TYPE "PublishState" USING "publishState"::"PublishState"';
        ALTER TABLE "Course" ALTER COLUMN "publishState" SET DEFAULT 'PUBLISHED'::"PublishState";
      END IF;
    END $$`)
  await run('Drop CoursePublishState', `
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname='CoursePublishState')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE udt_name='CoursePublishState')
      THEN DROP TYPE "CoursePublishState"; END IF;
    END $$`)
  console.log()

  // ── FASE 3: Fix accessType → TEXT ────────────────────────────────────
  console.log(`${B}[3/7] Allineamento accessType...${X}`)
  for (const t of ['CompanyCourseAssignment','UserCourseAssignment']) {
    await run(`${t}.accessType → TEXT`, `
      DO $$ DECLARE tp text; BEGIN
        SELECT udt_name INTO tp FROM information_schema.columns
        WHERE table_name='${t}' AND column_name='accessType';
        IF tp IS NOT NULL AND tp NOT IN ('text','varchar') THEN
          ALTER TABLE "${t}" ALTER COLUMN "accessType" DROP DEFAULT;
          EXECUTE 'ALTER TABLE "${t}" ALTER COLUMN "accessType" TYPE TEXT USING "accessType"::TEXT';
          ALTER TABLE "${t}" ALTER COLUMN "accessType" SET DEFAULT ''ACTIVE'';
        END IF;
      END $$`)
  }
  await run('Drop CourseAccessType', `
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname='CourseAccessType')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE udt_name='CourseAccessType')
      THEN DROP TYPE "CourseAccessType"; END IF;
    END $$`)
  console.log()

  // ── FASE 4: Colonne mancanti ──────────────────────────────────────────
  console.log(`${B}[4/7] Aggiunta colonne mancanti...${X}`)
  const colsToAdd = [
    ['Course',       'thumbnailUrl',       'TEXT'],
    ['Course',       'objective',          'TEXT'],
    ['User',         'firstName',          'TEXT'],
    ['User',         'lastName',           'TEXT'],
    ['User',         'avatarUrl',          'TEXT'],
    ['User',         'lastLoginAt',        'TIMESTAMP(3)'],
    ['User',         'mustChangePassword', 'BOOLEAN NOT NULL DEFAULT false'],
    ['Announcement', 'isPinned',           'BOOLEAN NOT NULL DEFAULT false'],
    ['Announcement', 'section',            "TEXT NOT NULL DEFAULT 'NEWS'"],
    ['Announcement', 'bannerUrl',          'TEXT'],
    ['Announcement', 'content',            'TEXT'],
    ['Event',        'isRegistrable',      'BOOLEAN NOT NULL DEFAULT false'],
    ['Event',        'availableSeats',     'INTEGER'],
    ['Event',        'registrations',      'INTEGER NOT NULL DEFAULT 0'],
    ['Event',        'endDate',            'TIMESTAMP(3)'],
    ['Event',        'recordingUrl',       'TEXT'],
  ]
  for (const [table, col, type] of colsToAdd) {
    await run(`${table}.${col}`, `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${col}" ${type}`)
  }
  console.log()

  // ── FASE 5: Indici ────────────────────────────────────────────────────
  console.log(`${B}[5/7] Indici di performance...${X}`)
  await run('UserProgress viewedAt', `CREATE INDEX IF NOT EXISTS "UP_viewedAt" ON "UserProgress"("userId","viewedAt")`)
  await run('UserProgress completed', `CREATE INDEX IF NOT EXISTS "UP_completed" ON "UserProgress"("userId","completed")`)
  await run('Announcement isPinned', `CREATE INDEX IF NOT EXISTS "Ann_isPinned" ON "Announcement"("isPinned","published")`)
  await run('Announcement section', `CREATE INDEX IF NOT EXISTS "Ann_section" ON "Announcement"("section","published")`)
  console.log()

  // ── FASE 6: Enum Role ─────────────────────────────────────────────────
  console.log(`${B}[6/7] Enum Role...${X}`)
  await run('Crea Role enum', `
    DO $$ BEGIN
      CREATE TYPE "Role" AS ENUM ('USER','ADMIN','TEAM_ADMIN');
    EXCEPTION WHEN duplicate_object THEN null; END $$`)
  console.log()

  // ── FASE 7: Verifica finale ───────────────────────────────────────────
  console.log(`${B}[7/7] Verifica finale...${X}`)
  let ok = true
  for (const { tablename } of tables) {
    if (await colExists(tablename, 'colonna')) {
      console.log(`  ${R}⚠ "colonna" ancora in ${tablename}${X}`); ok = false
    }
  }
  if (ok) console.log(`  ${G}✓ Campo "colonna" rimosso da tutto il DB${X}`)

  const finalType = await colType('Course', 'publishState')
  if (finalType === 'PublishState') {
    console.log(`  ${G}✓ publishState = PublishState enum${X}`)
  } else {
    console.log(`  ${Y}⚠ publishState tipo = ${finalType} (run: npx prisma migrate reset)${X}`)
  }

  console.log(`
${G}══ Script completato ══${X}

Prossimi passi OBBLIGATORI:
  ${B}npx prisma generate${X}    ← rigenera il Prisma Client
  ${B}pnpm start:dev${X}         ← riavvia il backend

Opzionale (se le query falliscono ancora):
  ${B}npx prisma migrate status${X}   ← diagnostica
  ${B}npx prisma db push --force-reset${X}  ← ⚠ CANCELLA TUTTI I DATI

${Y}Nota: questo script NON modifica il file schema.prisma.
Verifica che schema.prisma non abbia campi 'colonna' rimasti.${X}
`)
}

main()
  .catch(e => {
    console.error(`\n${R}❌ Errore fatale:${X}`, e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
