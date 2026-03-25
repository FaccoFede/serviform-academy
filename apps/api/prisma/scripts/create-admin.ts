/**
 * create-admin.ts — Script bootstrap per creare il primo utente ADMIN.
 *
 * USO:
 *   cd apps/api
 *   npx ts-node prisma/scripts/create-admin.ts
 *
 * Lo script:
 *   - Crea l'utente se non esiste
 *   - Aggiorna la password se l'utente esiste già
 *   - Imposta il ruolo ADMIN in entrambi i casi
 *
 * Modifica EMAIL e PASSWORD prima di eseguire.
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// ── CONFIGURAZIONE ─────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@serviform.com'      // ← cambia con la tua email
const ADMIN_PASSWORD = 'Admin1234!'            // ← cambia con una password sicura
const ADMIN_NAME = 'Amministratore'
// ───────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔧 Serviform Academy — Bootstrap Admin\n')
  console.log(`📧 Email:    ${ADMIN_EMAIL}`)
  console.log(`👤 Nome:     ${ADMIN_NAME}`)
  console.log(`🔑 Password: ${ADMIN_PASSWORD}\n`)

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      role: 'ADMIN',
      name: ADMIN_NAME,
      deletedAt: null,
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: ADMIN_NAME,
      role: 'ADMIN',
    },
  })

  console.log('✅ Utente admin creato/aggiornato:')
  console.log(`   ID:    ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Ruolo: ${user.role}`)
  console.log('\n💡 Accedi ora su http://localhost:3000/auth/login con le credenziali sopra.\n')
}

main()
  .catch(e => { console.error('❌ Errore:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
