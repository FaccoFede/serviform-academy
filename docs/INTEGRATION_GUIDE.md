# Serviform Academy — Guida Integrazione Completa (Fasi 1-4)

## Contenuto del pacchetto: 93 file

### Fase 1 — Fondamenta
- DTO con class-validator per tutti i controller
- HttpExceptionFilter globale
- ValidationPipe globale in main.ts
- CORS configurabile
- Client API centralizzato (`lib/api.ts`)
- Design system CSS tokens (`styles/globals.css`)
- Componenti layout: Topbar, Rail, Shell
- Componenti UI: CourseCard, VideoCard, Chip, FilterBar, Hero, VideoModal, ProgressBar, SoftwareTag
- Tutte le pagine refactorate con stili dal prototipo
- Pagina /videos completa

### Fase 2 — Content Blocks + Pagine Marketing
- Schema Prisma evoluto: contentBlocks JSON su Unit, metadata su Course/Software
- Migration SQL compatibile con dati esistenti
- Seed completo con tutti i contentBlocks dal prototipo HTML
- Componente `UnitContent` che renderizza blocchi: text, list, steps, callout, props, image, objectives, checklist
- Pagina /why (Perché Academy): value propositions, statistiche, feature cards
- Pagina /pricing (Piani): tre piani con feature comparison

### Fase 3 — Autenticazione + Progresso
- AuthModule NestJS completo: JWT, bcrypt, Passport
- AuthService: register, login, getProfile, validateToken
- JwtStrategy + JwtAuthGuard + RolesGuard
- DTO: LoginDto, RegisterDto
- AppModule aggiornato con AuthModule
- AuthContext React: login/register/logout con localStorage
- ProgressContext React: markCompleted, isCompleted, courseProgress
- Pagine /auth/login e /auth/register stilizzate
- Root layout con AuthProvider + ProgressProvider

### Fase 4 — Produzione
- CSS responsive (tablet + mobile)
- Dockerfile per il backend API
- docker-compose.yml (PostgreSQL + API)
- .env.example completo
- Documentazione architettura (ARCHITECTURE.md)
- Documentazione API reference (API.md)

---

## Procedura di integrazione passo-passo

### Step 1 — Installa dipendenze backend

```bash
cd apps/api
pnpm add bcrypt @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add -D @types/bcrypt @types/passport-jwt
```

### Step 2 — Copia i file backend

Dalla root del tuo repository:

```bash
# Crea cartelle nuove
mkdir -p apps/api/src/auth/dto
mkdir -p apps/api/src/auth/guards
mkdir -p apps/api/src/auth/strategies
mkdir -p apps/api/src/common/filters
mkdir -p apps/api/src/courses/dto
mkdir -p apps/api/src/software/dto
mkdir -p apps/api/src/videos/dto
mkdir -p apps/api/src/guides/dto
mkdir -p apps/api/src/progress/dto
mkdir -p apps/api/src/certificates/dto
mkdir -p apps/api/src/sync/dto

# Copia TUTTO il backend dal pacchetto
cp -r <pacchetto>/apps/api/src/* apps/api/src/
cp -r <pacchetto>/apps/api/prisma/* apps/api/prisma/
```

### Step 3 — Applica la migration

```bash
cd apps/api

# Opzione A: migration manuale (consigliata se hai già dati)
psql $DATABASE_URL -f prisma/migrations/20260318_evolution/migration.sql

# Opzione B: reset completo (solo sviluppo, cancella tutti i dati)
npx prisma migrate reset
npx prisma migrate dev --name evolution
```

### Step 4 — Configura seed e popola

Aggiungi a `apps/api/package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

```bash
pnpm add -D bcrypt @types/bcrypt   # necessario per il seed
npx prisma db seed
```

### Step 5 — Copia i file frontend

```bash
# Crea cartelle nuove
mkdir -p apps/web/src/components/layout
mkdir -p apps/web/src/components/ui
mkdir -p apps/web/src/components/features
mkdir -p apps/web/src/context
mkdir -p apps/web/src/lib
mkdir -p apps/web/src/styles
mkdir -p apps/web/src/app/videos
mkdir -p apps/web/src/app/why
mkdir -p apps/web/src/app/pricing
mkdir -p apps/web/src/app/auth/login
mkdir -p apps/web/src/app/auth/register
mkdir -p "apps/web/src/app/courses/[slug]/[unit]"

# Copia TUTTO il frontend dal pacchetto
cp -r <pacchetto>/apps/web/src/* apps/web/src/
cp <pacchetto>/apps/web/.env.example apps/web/
```

### Step 6 — Crea .env.local per il frontend

```bash
cd apps/web
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

### Step 7 — Crea .env per il backend (se non esiste)

```bash
cd apps/api
cat > .env << EOF
DATABASE_URL=postgresql://serviform:serviform_dev@localhost:5432/serviform_academy
JWT_SECRET=serviform-academy-jwt-secret-cambia-in-produzione
CORS_ORIGIN=http://localhost:3000
PORT=3001
EOF
```

### Step 8 — Copia infra e docs

```bash
cp -r <pacchetto>/infra/ .
cp -r <pacchetto>/docs/ .
```

### Step 9 — Avvia e testa

```bash
# Terminale 1
cd apps/api && pnpm start:dev

# Terminale 2
cd apps/web && pnpm dev
```

### Step 10 — Verifica

Apri http://localhost:3000 e verifica:

- [x] Topbar scura con navigazione
- [x] Rail laterale con icone
- [x] Hero animata con statistiche
- [x] Filter bar con chip software
- [x] Course cards stilizzate
- [x] /videos con hero featured + griglia
- [x] /why con value propositions e stats
- [x] /pricing con tre piani
- [x] /auth/login e /auth/register
- [x] Corso dettaglio con lista unità
- [x] Unità con sidebar + content blocks
- [x] Admin panel con form stilizzati

Test API:
```bash
# Registra utente
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test"}'

# Validazione DTO (deve dare errore 400)
curl -X POST http://localhost:3001/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"ab"}'
```

---

## File che NON vengono toccati

Questi file del repository originale restano invariati:

- `apps/api/src/courses/courses.service.ts`
- `apps/api/src/units/units.service.ts`
- `apps/api/src/units/units.module.ts`
- `apps/api/src/units/units.controller.ts`
- `apps/api/src/units/dto/create-unit.dto.ts`
- `apps/api/src/units/dto/unit-response.dto.ts`
- `apps/api/src/videos/videos.service.ts`
- `apps/api/src/guides/guides.service.ts`
- `apps/api/src/software/software.service.ts`
- `apps/api/src/progress/progress.service.ts`
- `apps/api/src/certificates/certificates.service.ts`
- `apps/api/src/prisma/*`
- `apps/api/src/users/*`
- Tutti i `*.module.ts` (tranne app.module.ts)
- Tutti i `*.spec.ts`
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/next.config.ts`
