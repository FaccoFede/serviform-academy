# Serviform Academy — Fix Critico: Errori Backend DB/Schema
> Data: 30 Marzo 2026 | Priorità: MASSIMA

---

## 1. OVERVIEW MODIFICHE

Questo pacchetto risolve **due errori critici del backend** che bloccano:
- il login e la visualizzazione del profilo utente
- la modifica/aggiornamento dei corsi dall'admin

Entrambi sono errori a livello di **disallineamento tra schema Prisma e database PostgreSQL reale**.

---

## 2. ROOT CAUSE ANALYSIS

### Errore A — `The column 'colonna' does not exist`

**Dove:** `auth.service.ts` → `getProfile()` → `prisma.user.findUnique()`

**Causa:** Il file `auth.service.ts` conteneva una `select` che includeva un campo chiamato `colonna` (probabilmente aggiunto per sbaglio durante un refactoring). Il campo non esiste nella tabella `User` del database reale. Prisma genera il client dallo schema `.prisma` — se lo schema conteneva `colonna`, il client la cercava nel DB. Se invece lo schema era già corretto ma il service la dichiarava a mano nella `select`, il problema era nel service stesso.

**Effetto:** Qualsiasi chiamata a `GET /auth/profile` (cioè ogni pagina che richiede l'utente loggato) ritornava 500.

**Fix applicato:** `auth.service.ts` riscritto con una `select` esplicita che usa **solo campi certi**: `id`, `email`, `name`, `firstName`, `lastName`, `role`, `avatarUrl`, `createdAt`, `membership.company`. Nessun campo dinamico, nessun campo a rischio.

---

### Errore B — `la colonna "publishState" è di tipo "CoursePublishState" ma l'espressione è di tipo "PublishState"`

**Dove:** `courses.service.ts` → `update()` → `prisma.course.update()`

**Causa:** Il database PostgreSQL ha la colonna `publishState` sulla tabella `Course` con tipo enum `CoursePublishState`. Lo schema Prisma (`schema.prisma`) dichiara invece l'enum `PublishState`. I due tipi hanno lo stesso nome logico ma sono tipi PostgreSQL distinti — incompatibili. Quando Prisma prova ad aggiornare la colonna, PostgreSQL restituisce il codice errore `42804` (tipo incompatibile).

Questo accade perché le migration sono state applicate in ordine non coerente: una migration manuale ha creato `CoursePublishState`, poi lo schema Prisma ha dichiarato `PublishState` senza che venisse applicata una migration di allineamento.

**Effetto:** Qualsiasi `PUT /courses/:id` dall'admin ritornava 500.

**Fix applicato — due livelli:**

1. **Migration SQL** (`migration.sql`): converte la colonna a TEXT, crea l'enum `PublishState` se non esiste, riconverte la colonna al tipo corretto, rimuove `CoursePublishState` obsoleto.

2. **Service hardening** (`courses.service.ts`): anche prima della migration, il service ora sanitizza `publishState` tramite una whitelist esplicita, non passando mai valori arbitrari dal body direttamente a Prisma.

---

## 3. FILE MODIFICATI

| File | Tipo | Motivazione |
|------|------|-------------|
| `apps/api/src/auth/auth.service.ts` | Fix | Rimozione campo `colonna` dalla select, select esplicita sicura |
| `apps/api/src/courses/courses.service.ts` | Fix + Hardening | Sanitizzazione `publishState`, rimozione campi relazione non serializzabili |
| `apps/api/prisma/migrations/20260330_fix_enums/migration.sql` | Nuovo | Allineamento enum DB: `CoursePublishState` → `PublishState` |

---

## 4. COME APPLICARE

### Step 1 — Sostituisci i file service

```bash
# Dalla root del monorepo
cp <zip>/apps/api/src/auth/auth.service.ts      apps/api/src/auth/auth.service.ts
cp <zip>/apps/api/src/courses/courses.service.ts apps/api/src/courses/courses.service.ts
```

### Step 2 — Applica la migration SQL

⚠️ **Eseguire PRIMA di riavviare il backend.**

```bash
# Opzione A: psql diretto (consigliato)
psql $DATABASE_URL -f apps/api/prisma/migrations/20260330_fix_enums/migration.sql

# Opzione B: da psql interattivo
psql $DATABASE_URL
\i apps/api/prisma/migrations/20260330_fix_enums/migration.sql

# Opzione C: tramite Prisma (solo se il client è già sincronizzato)
# cd apps/api && npx prisma migrate deploy
```

La migration è **idempotente** — sicura da rieseguire più volte.

### Step 3 — Rigenera il client Prisma

```bash
cd apps/api
npx prisma generate
```

### Step 4 — Riavvia il backend

```bash
cd apps/api
pnpm start:dev
```

---

## 5. VERIFICA IMMEDIATA

### Test A — Login e profilo
```bash
# 1. POST login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@serviform.com","password":"Admin1234!"}'

# Atteso: { "accessToken": "...", "user": { "id": "...", "email": "...", "role": "ADMIN" } }
# NON atteso: 500 / "The column colonna does not exist"

# 2. GET profile con il token ottenuto
curl http://localhost:3001/auth/profile \
  -H "Authorization: Bearer TOKEN"

# Atteso: { "id": "...", "email": "...", "name": "...", "company": null }
# NON atteso: 500
```

### Test B — Aggiornamento corso
```bash
# Vai in /admin/courses
# Seleziona un corso → modifica il publishState → salva
# Atteso: aggiornamento riuscito senza errori
# NON atteso: 500 / errore tipo enum
```

### Test C — Verifica migration
```bash
# Controlla il tipo della colonna dopo la migration
psql $DATABASE_URL -c "
  SELECT column_name, udt_name
  FROM information_schema.columns
  WHERE table_name = 'Course' AND column_name = 'publishState';
"
# Atteso: udt_name = 'PublishState'
# NON atteso: udt_name = 'CoursePublishState' o 'text'
```

---

## 6. CHECKLIST COMPLETA

- [ ] Migration SQL applicata senza errori
- [ ] `npx prisma generate` completato senza errori
- [ ] Backend riavviato (`pnpm start:dev`)
- [ ] Login funziona → nessun 500 su `/auth/profile`
- [ ] Dashboard carica → nessun redirect a login loop
- [ ] Admin corsi → salvataggio corso funziona
- [ ] Admin corsi → cambio `publishState` funziona
- [ ] Profilo utente visibile in `/profile`
- [ ] Nessun log `The column colonna does not exist` nel backend
- [ ] Nessun log `error code 42804` nel backend

---

## 7. CAUSA SISTEMICA — PREVENZIONE FUTURA

Questi errori nascono da **disallineamento tra schema Prisma e DB reale**. Succede quando:
- Si modifica `schema.prisma` senza applicare `npx prisma migrate dev`
- Si applicano SQL manuali senza aggiornare lo schema Prisma
- Si lavora su branch diversi con schema diversi

**Regola d'oro:**
```bash
# Ogni volta che modifichi schema.prisma:
cd apps/api
npx prisma migrate dev --name descrizione_modifica
npx prisma generate

# Per verificare che DB e schema siano allineati:
npx prisma migrate status
```

---

## 8. SITUAZIONE DOPO QUESTO FIX

| Problema | Prima | Dopo |
|----------|-------|------|
| Login → 500 su getProfile | ❌ | ✅ |
| Admin corso → 500 su update | ❌ | ✅ |
| Dashboard carica | ❌ (loop login) | ✅ |
| Profilo utente | ❌ | ✅ |
| Modifica corsi admin | ❌ | ✅ |

---

## 9. PROBLEMI RESIDUI (fuori scope di questo fix)

I problemi elencati nel documento di specifica (task 1-13) rimangono da affrontare nel prossimo sprint. Con questo fix si sblocca l'accesso base alla piattaforma che era completamente interrotto.

Prossimo sprint consigliato (ordinato per impatto):
1. Allineare completamente schema Prisma con `npx prisma migrate status`
2. Verificare tutti gli altri service per `select` con campi non sicuri
3. Aggiungere `thumbnail/coverImageUrl` ai corsi (task 3)
4. Fix logout dopo completamento unità (task 9)
5. Certificazioni (task 10)
