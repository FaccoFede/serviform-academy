# Serviform Academy — Guida allo sviluppo

Guida operativa: come si avvia il progetto, quali convenzioni seguire, e **ricette passo-passo** per i task più comuni. Per il quadro d'insieme leggi prima [ARCHITECTURE.md](./ARCHITECTURE.md); per lo schema DB [DATABASE.md](./DATABASE.md); per gli endpoint [API.md](./API.md).

---

## 1. Prerequisiti

- **Node.js 20+**
- **pnpm** (`corepack enable` lo abilita)
- **PostgreSQL 16** in esecuzione e raggiungibile (locale o via Docker)

Il monorepo **non è un workspace pnpm unico**: `apps/api` e `apps/web` hanno ciascuno il proprio `package.json`/`pnpm-lock.yaml`. Si installano e si avviano separatamente.

---

## 2. Setup iniziale

### Backend (`apps/api`) — porta 3001

```bash
cd apps/api
cp ../../infra/.env.example .env       # poi correggi DATABASE_URL, JWT_SECRET, ecc.
pnpm install
npx prisma migrate dev                 # crea/aggiorna lo schema nel DB e genera il client
npx prisma db seed                     # dati di esempio (4 software, 5 corsi, azienda demo, annuncio)
pnpm start:dev                         # watch mode su http://localhost:3001
```

### Frontend (`apps/web`) — porta 3000

```bash
cd apps/web
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > .env.local
pnpm install
pnpm dev                               # http://localhost:3000
```

### Tutto con Docker (PostgreSQL + API)

```bash
docker compose -f infra/docker-compose.yml up --build
# poi, dentro il container o in locale: npx prisma migrate deploy && npx prisma db seed
```

### Creare il primo admin

Il seed **non crea utenti**. Per ottenere un account amministratore:

```bash
# 1. Registra un utente
curl -X POST http://localhost:3001/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"dev@example.com","password":"Password123!","name":"Dev"}'
# → { "accessToken": "<TOKEN>", "user": { ... } }

# 2. Promuovilo (funziona solo se non esiste ancora nessun ADMIN — è il bootstrap)
curl -X POST http://localhost:3001/auth/promote-admin -H 'Authorization: Bearer <TOKEN>'
# → ritorna un NUOVO accessToken con role=ADMIN: usa quello d'ora in poi
```

In alternativa, in sviluppo: `UPDATE "User" SET role='ADMIN' WHERE email='dev@example.com';` direttamente nel DB.

---

## 3. Comandi utili

### `apps/api`
| Comando | Cosa fa |
|---|---|
| `pnpm start:dev` | API in watch mode |
| `pnpm build` / `pnpm start:prod` | build (`dist/`) / avvio produzione (`node dist/main`) |
| `npx prisma migrate dev --name X` | crea+applica una migration, rigenera il client |
| `npx prisma migrate deploy` | applica le migration pendenti (CI/produzione) |
| `npx prisma migrate status` | verifica allineamento DB ↔ migration |
| `npx prisma generate` | rigenera il client Prisma (dopo un pull) |
| `npx prisma db seed` | popola dati di esempio |
| `npx prisma studio` | GUI per ispezionare il DB |
| `pnpm test` | Jest — **al momento non ci sono test reali** (`passWithNoTests`); vedi § Problemi noti |
| `pnpm lint` | `eslint --fix` su tutti i `.ts` — **attenzione, riscrive i file** (vedi § Problemi noti) |

### `apps/web`
| Comando | Cosa fa |
|---|---|
| `pnpm dev` | dev server Next.js |
| `pnpm build` / `pnpm start` | build / avvio produzione |
| `pnpm lint` | ESLint (config `eslint-config-next`) |
| `npx tsc --noEmit -p tsconfig.json` | type-check (deve essere pulito) |

---

## 4. Variabili d'ambiente

Riferimento: `infra/.env.example`.

### Backend — `apps/api/.env`
| Variabile | Default | Note |
|---|---|---|
| `DATABASE_URL` | `postgresql://serviform:serviform_dev@localhost:5432/serviform_academy` | Connessione PostgreSQL |
| `JWT_SECRET` | `serviform-academy-jwt-secret-change-in-production` | **Cambiala in produzione** |
| `PORT` | `3001` | Porta dell'API |
| `CORS_ORIGIN` | `http://localhost:3000` | In dev il backend accetta comunque qualsiasi origin |
| `UPLOAD_DIR` | `./uploads` | Cartella servita su `/uploads` |
| `VIDEO_UPLOAD_DIR` | `./uploads/videos` | Sottocartella per i video |

### Frontend — `apps/web/.env.local`
| Variabile | Default | Note |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Base URL dell'API. **Esposta al browser** — niente segreti. |

> Le costanti frontend non-segrete (numeri di anteprima, specifiche immagini, ruoli, stati di pubblicazione) stanno in `apps/web/src/lib/config.ts`, non in `.env`.

---

## 5. Convenzioni del repository

- **Lingua**: codice, commenti, nomi e documentazione in **italiano**.
- **Frontend ↔ backend**: tutte le chiamate passano da **`apps/web/src/lib/api.ts`**. Niente `fetch()` diretto nelle pagine; se manca un endpoint, lo aggiungi lì nel namespace giusto.
- **`API_URL`**: unica fonte di verità in `apps/web/src/lib/config.ts`. Non ridefinire `process.env.NEXT_PUBLIC_API_URL` inline. (`lib/api.ts` riesporta `API_BASE_URL` come alias storico; per nuovo codice usa `API_URL` da `@/lib/config`.)
- **Accesso/progresso corsi**: usa gli helper puri di `apps/web/src/lib/courseAccess.ts` (`resolveCourseAccess`, `countableUnits`, `calculateRealProgress`). Le unità `OVERVIEW` non contano nel progresso; i corsi non assegnati non vanno in "I miei corsi"; `publishState === 'HIDDEN'` non si mostra mai.
- **Brand software**: default in `apps/web/src/lib/brands.ts` (`getBrand(slug, dbSoftware?)`); i valori live arrivano dall'admin Software.
- **Stili**: CSS Modules per pagina/componente (`*.module.css`) + design tokens globali in `apps/web/src/styles/globals.css`. Niente CSS-in-JS.
- **Backend**: un modulo = `*.module.ts` + `*.controller.ts` + `*.service.ts` (+ `dto/` se serve validazione). Le query DB stanno nei service, non nei controller. I controller registrano le rotte e applicano i guard.
- **Validazione**: per nuovi endpoint con payload non banali, crea un DTO con `class-validator` in `dto/` (lo schema attuale ha DTO solo per alcuni moduli; gli altri usano `body: any`).
- **Schema Prisma**: ogni modifica = una migration (vedi § ricetta sotto). Mai SQL a mano senza aggiornare lo schema.
- **Git**: il branch di lavoro corrente è indicato dal task; commit chiari e descrittivi.
- **Niente segreti** committati: `.env`, `.env.local`, e `uploads/` sono in `.gitignore`.

---

## 6. Ricette

### 6.1 — Aggiungere un modulo backend

1. `mkdir apps/api/src/<nome>` con `<nome>.module.ts`, `<nome>.controller.ts`, `<nome>.service.ts` (copia un modulo semplice come `software/` come modello).
2. Il service inietta `PrismaService` (`constructor(private prisma: PrismaService) {}`); il module importa `PrismaModule` solo se non è globale già accessibile (lo è — basta dichiararlo in `imports` se serve, ma di norma `PrismaModule` è disponibile).
3. Registra il modulo in `apps/api/src/app.module.ts` (import + array `imports`).
4. Se serve un nuovo modello, aggiungilo a `schema.prisma` e fai la migration (§ 6.3).
5. Aggiungi i metodi corrispondenti in `apps/web/src/lib/api.ts` e aggiorna [API.md](./API.md).

### 6.2 — Aggiungere un endpoint a un modulo esistente

1. Nel `*.controller.ts`: aggiungi il metodo con il decoratore (`@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`), i `@Param`/`@Body`/`@Request` necessari, e i guard (`@UseGuards(JwtAuthGuard)` o `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN','TEAM_ADMIN')`).
   - ⚠ Le rotte con segmento fisso (es. `@Get('portal')`) vanno **prima** di quelle con parametro (`@Get(':slug')`).
2. Implementa la logica nel `*.service.ts`.
3. Se il body è strutturato, crea/aggiorna un DTO in `dto/`.
4. Aggiungi il metodo client in `apps/web/src/lib/api.ts` (namespace coerente).
5. Aggiorna [API.md](./API.md).

### 6.3 — Cambiare lo schema del database

```bash
cd apps/api
# 1. modifica apps/api/prisma/schema.prisma (campo nuovo, modello nuovo, relazione…)
npx prisma migrate dev --name descrizione_modifica   # crea la migration, applica, rigenera il client
# 2. aggiorna i service che usano il nuovo campo/modello
# 3. se hai toccato Role o PublishState: aggiorna anche apps/web/src/lib/config.ts
# 4. se serve, aggiorna apps/api/prisma/seed.ts
npx prisma migrate status   # verifica allineamento
```

In produzione/CI: `npx prisma migrate deploy`. Mai applicare SQL a mano senza aggiornare lo schema (vedi [DATABASE.md](./DATABASE.md) § "regole d'oro"). Per SQL custom in una migration, rendila idempotente quando puoi.

### 6.4 — Aggiungere una pagina frontend

1. Crea `apps/web/src/app/<rotta>/page.tsx`. Server Component per default; aggiungi `'use client'` in cima solo se serve interattività (`useState`, `onClick`, hook).
2. Per i dati usa `api.*` da `@/lib/api` (Server Component: chiama direttamente; Client Component: in `useEffect`/handler).
3. Stili: crea `<rotta>/<Nome>.module.css` e importalo (`import styles from './Nome.module.css'`). Usa i token di `styles/globals.css` (`var(--red)`, `var(--ink)`, ecc.).
4. Se la pagina va nel menu, aggiungila alla `Topbar` (vedi § 6.7) e/o crea un link da dove serve.
5. Se la pagina è riservata, gestisci l'auth via `AuthContext` (redirect a `/auth/login` se non loggato); le pagine admin stanno sotto `app/admin/` e condividono `admin/layout.tsx`.

### 6.5 — Aggiungere una sezione CRUD nell'admin

Quasi tutte le sezioni admin riusano il componente generico `AdminCrud` (`apps/web/src/components/features/AdminCrud.tsx`). Esempio minimo (`apps/web/src/app/admin/software/page.tsx`):

```tsx
'use client'
import AdminCrud from '@/components/features/AdminCrud'
import { api } from '@/lib/api'

export default function AdminEsempioPage() {
  return (
    <AdminCrud
      title="Esempio"
      columns={[
        { key: 'name', label: 'Nome' },
        { key: 'color', label: 'Colore', render: (v) => v ?? '-' },  // render opzionale
      ]}
      fetchItems={api.esempio.findAll}
      onSave={(data) => api.esempio.create(data)}
      onUpdate={(id, data) => api.esempio.update(id, data)}
      onDelete={(id) => api.esempio.remove(id)}
      formFields={[
        { key: 'name', label: 'Nome', type: 'text', required: true },
        { key: 'note', label: 'Note', type: 'textarea' },
        { key: 'content', label: 'Contenuto', type: 'richtext' },
        // select con opzioni dinamiche dal backend:
        { key: 'softwareId', label: 'Software', type: 'select',
          loadOptions: async () => (await api.software.findAll()).map(s => ({ value: s.id, label: s.name })) },
        // campo completamente custom:
        { key: 'extra', label: 'Extra', type: 'custom', customRender: () => <MyWidget /> },
      ]}
    />
  )
}
```

Tipi di campo: `text`, `textarea`, `number`, `select` (con `options` statiche o `loadOptions` async), `richtext`, `custom` (con `customRender`). Props utili in più: `onEdit(item)` (precarica stati custom all'apertura del form di modifica), `extraActions(item)` (azioni aggiuntive per riga, es. link a una sezione collegata), `emptyMessage`. Poi crea i metodi `api.esempio.*` in `lib/api.ts`.

> Sezioni con esigenze particolari (es. **Unità** raggruppate per corso, **Aziende** con gestione preferenze, **Import** CSV) hanno pagine admin custom — guarda il file `page.tsx` corrispondente come riferimento.

### 6.6 — Aggiungere un metodo al client `lib/api.ts`

Apri `apps/web/src/lib/api.ts`, trova (o crea) il namespace giusto e aggiungi:

```ts
esempio: {
  findAll: () => request<Esempio[]>('/esempio'),
  findById: (id: string) => request<Esempio>('/esempio/' + id),
  create: (data: any) => request('/esempio', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request('/esempio/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request('/esempio/' + id, { method: 'DELETE' }),
},
```

Per gli upload usa l'helper `multipart(path, file, token, extraFields?)`. Il token viene iniettato automaticamente da `request()` (da `localStorage.sa_token`); su `401` il client fa logout + redirect a `/auth/login`. Per gli URL di video relativi usa `resolveVideoUrl(url)`.

### 6.7 — Modificare design system / navigazione

- **Colori, font, spaziature**: `apps/web/src/styles/globals.css` (variabili `--red*`, `--coal`, `--ink`, `--muted`/`--muted-dark`, `--border`, `--surface`, `--white`, `--gold*`; brand `--ev/--sy/--po` + `*-light`; `--font-display/body/mono`; `--topbar-h`, `--rail-w` (oggi `0px` — la rail laterale è stata rimossa), `--sidebar-w`; `--r`, `--r-lg`, `--shadow-sm/md/lg`; `--t-*` per le transizioni). Cambiare il valore qui si propaga ovunque.
- **Font**: il display/body è **Bergen Sans** (font proprietario Serviform), caricato via `@font-face` da `apps/web/public/fonts/` direttamente in `globals.css`; **DM Mono** è caricato in `apps/web/src/app/layout.tsx` con `next/font/google` come variabile `--font-mono`. Per cambiare un font aggiorna il punto di caricamento corrispondente **e** la variabile CSS in `globals.css`.
- **Colori brand dei software**: `apps/web/src/lib/brands.ts` (`SOFTWARE_BRANDS`, `getBrand`, `LEVEL_COLORS`). I valori live vengono dall'admin Software; questi sono i fallback.
- **Navigazione (Topbar)**: vedi [Web/BARRA_SUPERIORE.md](./Web/BARRA_SUPERIORE.md) — modifica l'array delle voci in `apps/web/src/components/layout/Topbar.tsx`. Lo `Shell` (`components/layout/Shell.tsx`) aggiunge il padding per non finire sotto la topbar.
- **Responsive**: `apps/web/src/styles/responsive.css` (breakpoint tablet ≤1024px, mobile ≤768px).

---

## 7. Problemi noti / trappole

- **`pnpm lint` nel backend è distruttivo**: lo script è `eslint ... --fix`, che riscrive tutti i `.ts` con auto-format non correlato alle tue modifiche (ci sono ~250 problemi pre-esistenti di `no-unsafe-*` su `any`). Non usarlo come gate. Sistemare lint/format è un intervento a sé (Fase 5 del cleanup).
- **Nessun test reale**: gli spec scaffold sono stati rimossi; `pnpm test` passa solo grazie a `passWithNoTests: true`. Test veri sono in roadmap (Fase 5).
- **`next build` e i font**: in ambienti senza accesso a `fonts.googleapis.com` l'ultimo step di ottimizzazione font fallisce. È un limite dell'ambiente, non del codice: la build va completata in locale/CI con rete.
- **Drift schema Prisma ↔ DB**: la causa storica di errori 500. Tieni sempre allineati schema e migration (vedi [DATABASE.md](./DATABASE.md)).
- **Endpoint mancante `reset-password`**: la UI in `admin/users` chiama `POST /auth/admin/reset-password/:id` che **non esiste** nel backend — funzionalità rotta da decidere (implementare l'endpoint o togliere la UI).
- **`uploads/`**: i file caricati a runtime non sono versionati; alcuni `.mp4` storici in `apps/api/uploads/videos/` restano tracciati per scelta (nessuna riscrittura della history).
- **Rotte legacy**: `videos/`, `calendar/`, `communications/`, `communications-events/`, `events/` lato web sono in via di assorbimento in `newsroom` (Fase 3 del cleanup); alcune reindirizzano già.
- **`promote-admin`** funziona solo finché non esiste alcun ADMIN: è un bootstrap, non un'operazione ripetibile.
- **Modelli senza modulo**: `VideoPill` e `PricingPackage` sono nello schema ma non hanno (più) un modulo backend attivo — vedi [CLEANUP_LOG.md](./CLEANUP_LOG.md).

---

## 8. Per approfondire

- [ARCHITECTURE.md](./ARCHITECTURE.md) — struttura, moduli, modello di accesso, contenuti.
- [DATABASE.md](./DATABASE.md) — schema modello per modello + migration.
- [API.md](./API.md) — tutti gli endpoint.
- [Web/](./Web/) — mappe tecniche delle singole pagine frontend.
- [CLEANUP_LOG.md](./CLEANUP_LOG.md) — storia del refactor e cosa è ancora in sospeso (Fasi 3-5).
