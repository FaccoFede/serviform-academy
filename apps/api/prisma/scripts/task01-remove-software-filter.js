// task01-remove-software-filter.js
// Rimuove la feature "filtro software per azienda" dal DB.
// USO: cd apps/api && node prisma/scripts/task01-remove-software-filter.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const steps = [
  [
    'Rimuovi tabella CompanyInterest',
    `DROP TABLE IF EXISTS "CompanyInterest" CASCADE`,
  ],
  [
    'Rimuovi colonna visibleSoftwareIds da Company',
    `ALTER TABLE "Company" DROP COLUMN IF EXISTS "visibleSoftwareIds"`,
  ],
]

async function main() {
  console.log('\n🔧  TASK-01 — Rimozione filtro software aziende\n')
  for (const [name, sql] of steps) {
    try {
      await prisma.$executeRawUnsafe(sql)
      console.log(`  ✅  ${name}`)
    } catch (e) {
      console.error(`  ❌  ${name}: ${e.message || e}`)
    }
  }
  console.log('\n✅  Migrazione completata.\n')
}

main()
  .catch(e => { console.error(e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
