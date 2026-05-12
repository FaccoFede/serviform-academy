# Serviform Academy — Architettura

> Stato del codice: maggio 2026. Per le ricette di sviluppo vedi [DEVELOPMENT.md](./DEVELOPMENT.md); per lo schema DB vedi [DATABASE.md](./DATABASE.md); per gli endpoint vedi [API.md](./API.md).

## 1. Stack

| Layer | Tecnologia | Versione |
|---|---|---|
| Frontend | Next.js (App Router, React Compiler) | 16.x |
| UI | React | 19.x |
| Backend | NestJS | 11.x |
| Database | PostgreSQL | 16 |
| ORM | Prisma | 6.x |
| Auth | JWT + bcrypt + Passport (`passport-jwt`) | — |
| PDF certificati | jsPDF (lato browser) | 4.x |
| Linguaggio | TypeScript | 5.x |
| Package manager | pnpm | — |
| Deploy | Docker (`infra/`) per l'API; Next.js su Vercel o Node | — |

**Non è un workspace pnpm unico:** `apps/api` e `apps/web` hanno ciascuno il proprio `package.json` e `pnpm-lock.yaml`; si installano e si avviano separatamente. Le cartelle `apps/cms/` e `packages/` sono placeholder vuoti.

## 2. Struttura del monorepo

```
serviform-academy/
├── apps/
│   ├── api/                         ← Backend NestJS
│   │   ├── src/
│   │   │   ├── main.ts              ← bootstrap: CORS, ValidationPipe, filtro errori, static /uploads
│   │   │   ├── app.module.ts        ← registra tutti i moduli
│   │   │   ├── prisma/              ← PrismaModule + PrismaService (client DB condiviso)
│   │   │   ├── common/filters/      ← HttpExceptionFilter (formato errori uniforme)
│   │   │   ├── auth/                ← login/registrazione, JWT, guards, decorator @Roles
│   │   │   ├── users/               ← gestione utenti (admin)
│   │   │   ├── companies/           ← aziende B2B + preferenze di visibilità
│   │   │   ├── assignments/         ← assegnazione corsi ad aziende/utenti
│   │   │   ├── courses/             ← corsi/moduli formativi
│   │   │   ├── units/               ← unità didattiche (lezioni/esercizi/overview)
│   │   │   ├── guides/              ← guide Zendesk collegate alle unità
│   │   │   ├── guide-catalog/       ← catalogo centralizzato di guide Zendesk
│   │   │   ├── exercises/           ← esercitazioni (anteprima HTML 3D + file .evd)
│   │   │   ├── software/            ← prodotti Academy (EngView, Sysform, ProjectO, ServiformA)
│   │   │   ├── progress/            ← tracciamento avanzamento (viste/completamenti)
│   │   │   ├── certificates/        ← attestati/badge di completamento corso
│   │   │   ├── announcements/       ← comunicazioni/news (newsroom)
│   │   │   ├── events/              ← eventi/webinar
│   │   │   ├── imports/             ← import CSV massivo (aziende/utenti)
│   │   │   ├── uploads/             ← upload immagini → /uploads/...
│   │   │   └── video-assets/        ← video caricati o esterni usati nelle unità
│   │   ├── prisma/
│   │   │   ├── schema.prisma        ← schema del database (fonte di verità dei modelli)
│   │   │   ├── migrations/          ← migration SQL versionate
│   │   │   └── seed.ts              ← dati iniziali (`prisma db seed`)
│   │   └── uploads/                 ← file caricati a runtime (NON versionati; vedi .gitignore)
│   │
│   └── web/                         ← Frontend Next.js
│       └── src/
│           ├── app/                 ← pagine (App Router) + layout root
│           ├── components/
│           │   ├── layout/          ← Topbar, Shell (+ index.ts)
│           │   ├── ui/              ← CourseCard, VideoCard, Chip, FilterBar, ProgressBar, VideoModal, AnnouncementModal (+ index.ts)
│           │   └── features/        ← AdminCrud, ExerciseCard, ProtectedVideo
│           ├── context/             ← AuthContext, ProgressContext
│           ├── hooks/               ← useUnsavedChanges
│           ├── lib/                 ← api.ts (client HTTP), config.ts (costanti), brands.ts, courseAccess.ts, formatters.ts, certificate.ts, announcementTypes.ts
│           └── styles/              ← globals.css (design tokens), responsive.css
│
├── docs/                            ← questa documentazione
└── infra/                           ← Dockerfile.api, docker-compose.yml, .env.example
```

## 3. Flusso di una richiesta

```
Browser
  │  fetch via apps/web/src/lib/api.ts  (token JWT in Authorization: Bearer …)
  ▼
NestJS API  (localhost:3001)
  │  Controller → ValidationPipe (DTO) → Guards (JwtAuthGuard, RolesGuard) → Service
  ▼
PrismaService  →  PostgreSQL  (localhost:5432)
```

- Tutti gli errori passano da `HttpExceptionFilter` → risposta JSON uniforme (vedi [API.md](./API.md) § "Formato errori").
- Il frontend **non fa `fetch()` diretto** nelle pagine: passa sempre da `lib/api.ts`. Se manca un endpoint, si aggiunge lì.
- Su risposta `401` il client cancella il token e reindirizza a `/auth/login`.

## 4. Moduli backend

Ogni modulo NestJS = cartella con `*.module.ts` (registrazione), `*.controller.ts` (rotte HTTP), `*.service.ts` (logica + Prisma), e opzionalmente `dto/` (validazione con `class-validator`).

| Modulo | Base path | Ruolo |
|---|---|---|
| `AuthModule` | `/auth` | Registrazione, login (JWT), profilo, cambio password, promozione admin |
| `UsersModule` | `/users` | CRUD utenti — solo ADMIN/TEAM_ADMIN |
| `CompaniesModule` | `/companies` | CRUD aziende + `visibleSoftwareIds` (filtro contenuti nel portale) — solo admin |
| `AssignmentsModule` | `/assignments` | Assegnazione corsi ad aziende e utenti — solo admin |
| `CoursesModule` | `/courses` | Corsi; lista pubblica + lista "portale" filtrata per azienda; CRUD admin |
| `UnitsModule` | `/units` | Unità di un corso; dettaglio per slug; CRUD + riordino — admin |
| `GuidesModule` | `/guides` | Guide Zendesk collegate alle unità |
| `GuideCatalogModule` | `/guide-catalog` | Catalogo centralizzato di guide (URL → titolo recuperato automaticamente) |
| `ExercisesModule` | `/exercises` | Esercitazioni collegate alle unità (anteprima HTML 3D + file `.evd`) |
| `SoftwareModule` | `/software` | I 4 prodotti Academy: nome, slug, colore brand. Lista pubblica; CRUD admin |
| `ProgressModule` | `/progress` | Segna unità "vista"/"completata"; progresso per corso; aggregati dashboard |
| `CertificatesModule` | `/certificates` | Emissione/lettura/revoca attestati (un certificato per `userId+courseId`) |
| `AnnouncementsModule` | `/announcements` | Comunicazioni/news; tracking lettura per utente; CRUD admin |
| `EventsModule` | `/events` | Eventi/webinar; liste upcoming/past; CRUD admin |
| `ImportsModule` | `/imports` | Import CSV massivo di aziende o utenti — solo admin |
| `UploadsModule` | `/uploads` | Upload immagini (multipart) → URL servito da `/uploads/...` |
| `VideoAssetsModule` | `/video-assets` | Video caricati sul server o link esterni, riferibili dalle unità |

`PrismaModule` è globale: espone `PrismaService` a tutti i moduli. `app.module.ts` è l'unico punto in cui i moduli vengono registrati.

## 5. Autenticazione e ruoli

- `POST /auth/register` e `POST /auth/login` → restituiscono `{ accessToken, user }`. Il frontend salva il token in `localStorage` (`sa_token`) tramite `AuthContext`.
- `JwtStrategy` valida il Bearer token; `JwtAuthGuard` protegge le rotte autenticate; `RolesGuard` + `@Roles('ADMIN', 'TEAM_ADMIN')` proteggono le rotte admin.
- Ruoli (`enum Role`): **USER** (default), **ADMIN**, **TEAM_ADMIN**.
- Campo `mustChangePassword` sull'utente: forza il cambio password al primo accesso (es. utenti creati via import CSV).

## 6. Modello di accesso ai corsi

Tre meccanismi indipendenti decidono cosa un utente vede e può aprire:

1. **`Course.publishState`** (`HIDDEN` | `VISIBLE_LOCKED` | `PUBLISHED`)
   - `HIDDEN`: il corso non appare mai nel portale.
   - `VISIBLE_LOCKED`: appare ma non è apribile (badge "Bloccato").
   - `PUBLISHED`: visibile e apribile (se assegnato).
2. **Assegnazioni** (`UserCourseAssignment`, `CompanyCourseAssignment`): un corso compare in "I miei corsi" solo se assegnato all'utente o alla sua azienda. Le assegnazioni hanno `accessType` e una `expiresAt` opzionale (corso "scaduto").
3. **Visibilità per azienda** (`Company.visibleSoftwareIds`): se valorizzato, l'azienda vede nel portale solo i contenuti dei software elencati. Array vuoto = vede tutto. Non si applica a Comunicazioni ed Eventi. Endpoint dedicato: `GET /courses/portal`.

La logica condivisa lato frontend vive in **`apps/web/src/lib/courseAccess.ts`** (`resolveCourseAccess`, `countableUnits`, `calculateRealProgress`). Regole invarianti documentate lì:
- le unità `OVERVIEW` **non** contano nel progresso;
- i corsi non assegnati **non** compaiono in "I miei corsi";
- `publishState === 'HIDDEN'` → mai mostrato.

## 7. Modello dei contenuti

```
Software (1) ──< (N) Course ──< (N) Unit ──< (N) GuideReference ─?─ GuideCatalog
                                  │
                                  └──< (N) Exercise        Unit.videoUrl → VideoAsset (o URL esterno)
```

- **Unit.unitType**: `OVERVIEW` (panoramica del corso, `order = 0`, non conta nel progresso), `LESSON`, `EXERCISE`. L'`order` di lezioni/esercizi è gestito dal backend (1, 2, 3…); `POST /units/course/:courseId/reorder` lo ricalcola.
- **Unit.content**: HTML ricco (campo `Text`). Il frontend lo renderizza così com'è.
- **Unit.duration**: stringa formattata mostrata in UI (es. "1h 30min"); in creazione si passano `durationHours`/`durationMinutes` e il backend formatta `duration`.
- **GuideReference**: link a `support.serviform.com`. Se selezionata dal **catalogo guide**, ha `catalogId` valorizzato e si gestisce nel catalogo centralizzato.
- **Exercise**: `htmlUrl` (anteprima 3D in iframe) + `evdUrl` (file scaricabile). Solo per unità di tipo `EXERCISE`.
- **Certificate**: emesso al completamento del corso se `Course.issuesBadge` è true; unico per `userId+courseId`; il PDF dell'attestato è generato lato browser con jsPDF (`lib/certificate.ts`).

Soft delete (campo `deletedAt`) su: `User`, `Company`, `Software`, `Course`, `Unit`.

## 8. Frontend — pagine (App Router)

Ogni `page.tsx` sotto `apps/web/src/app/` è una rotta. Il layout root (`app/layout.tsx`) avvolge tutto con `AuthProvider` + `ProgressProvider` + `Topbar` + `Shell` e carica il font DM Mono e i CSS globali.

| Rotta | Note |
|---|---|
| `/` | Homepage marketing (statistiche, teaser corsi). Vedi [Web/PAGINA_INIZIALE.md](./Web/PAGINA_INIZIALE.md) |
| `/why` | "Perché Academy" — value proposition |
| `/auth/login`, `/auth/register` | Accesso/registrazione. Vedi [Web/LOGIN.md](./Web/LOGIN.md) |
| `/dashboard` | Cruscotto utente (KPI, ultimi corsi, comunicazioni). Vedi [Web/DASHBOARD.md](./Web/DASHBOARD.md) |
| `/catalog` | Catalogo corsi con progresso dell'utente |
| `/courses/[slug]` | Dettaglio corso: obiettivi, lista unità, azioni |
| `/courses/[slug]/[unit]` | Dettaglio unità: contenuto HTML, video protetto, guide, esercitazioni, navigazione |
| `/newsroom` | Comunicazioni + eventi. Vedi [Web/NEWSROOM.md](./Web/NEWSROOM.md) |
| `/profile` | Profilo utente (dati, cambio password) |
| `/profile/certificates` | Attestati ottenuti (download PDF) |
| `/admin` | Home pannello admin (con `admin/layout.tsx`) |
| `/admin/{courses,units,software,exercises,guides,videos,announcements,events,companies,users,assignments,certificates,imports}` | Sezioni CRUD admin, in gran parte basate sul componente `AdminCrud` |
| `/videos`, `/calendar`, `/communications`, `/communications-events`, `/events` | Rotte legacy: alcune reindirizzano o sono in via di assorbimento in `/newsroom` (vedi [CLEANUP_LOG.md](./CLEANUP_LOG.md) Fase 3) |

## 9. File statici e upload

- `apps/api/src/main.ts` monta `./uploads` (o `UPLOAD_DIR`) su `/uploads`. Quindi un'immagine caricata via `POST /uploads/image` è raggiungibile a `http://<api>/uploads/<filename>`.
- I video in `./uploads/videos/` sono serviti dallo stesso prefisso.
- I `VideoAsset` caricati salvano un **path relativo** (`/uploads/videos/…`); il client lo risolve con `resolveVideoUrl()` in `lib/api.ts` usando `NEXT_PUBLIC_API_URL`. Mai hardcodare `localhost`.
- La cartella `uploads/` è in `.gitignore` (alcuni `.mp4` storici restano tracciati per scelta — vedi [CLEANUP_LOG.md](./CLEANUP_LOG.md)).

## 10. Build e deploy

- **API**: `pnpm build` (`nest build` → `dist/`), `pnpm start:prod` (`node dist/main`). `infra/Dockerfile.api` fa `prisma generate` + build e produce un'immagine; `infra/docker-compose.yml` avvia PostgreSQL 16 + API.
- **Web**: `pnpm build` (`next build`), `pnpm start`. In ambienti senza rete l'ultimo step di ottimizzazione font Google può fallire (limite dell'ambiente, non del codice). `next.config.ts` ha `reactCompiler: true` e `transpilePackages: ['jspdf']`.
- Variabili d'ambiente: vedi `infra/.env.example` e [DEVELOPMENT.md](./DEVELOPMENT.md) § "Variabili d'ambiente".
