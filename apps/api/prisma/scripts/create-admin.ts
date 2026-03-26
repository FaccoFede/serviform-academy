/**
 * create-admin.ts — Crea il primo utente ADMIN nel DB.
 *
 * ESEGUI DA apps/api/:
 *   npx ts-node --project tsconfig.json -e "require('./prisma/scripts/create-admin')"
 *
 * oppure più semplicemente:
 *   npx ts-node prisma/scripts/create-admin.ts
 *
 * Modifica EMAIL e PASSWORD prima di eseguire.
 * Lo script è idempotente: se l'utente esiste già, aggiorna password e ruolo.
 */
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const EMAIL    = 'admin@serviform.com'  // ← modifica con la tua email
const PASSWORD = 'Admin1234!'           // ← modifica con una password sicura
const NAME     = 'Amministratore'

async function main() {
  console.log('\n🔧  Serviform Academy — Bootstrap Admin\n')
  const hash = await bcrypt.hash(PASSWORD, 12)
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash: hash, role: 'ADMIN', name: NAME, deletedAt: null },
    create: { email: EMAIL, passwordHash: hash, name: NAME, role: 'ADMIN' },
  })
  console.log('✅  Admin creato/aggiornato')
  console.log('    Email:   ' + user.email)
  console.log('    Ruolo:   ' + user.role)
  console.log('    ID:      ' + user.id)
  console.log('\n🔑  Accedi su /auth/login con:')
  console.log('    email:    ' + EMAIL)
  console.log('    password: ' + PASSWORD + '\n')
}

main()
  .catch(e => { console.error('❌  Errore:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
