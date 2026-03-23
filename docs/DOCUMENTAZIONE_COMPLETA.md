# Serviform Academy — Documentazione Completa del Progetto

> Versione 2.0 — Marzo 2026
> Questo documento spiega OGNI file del progetto, come funziona, come modificarlo e perché è stato fatto così.

---

## Sommario

1. [Architettura generale](#1-architettura-generale)
2. [Come avviare il progetto](#2-come-avviare-il-progetto)
3. [Backend (NestJS)](#3-backend-nestjs)
4. [Database (Prisma)](#4-database-prisma)
5. [Frontend (Next.js)](#5-frontend-nextjs)
6. [Design System](#6-design-system)
7. [Componenti](#7-componenti)
8. [Pagine](#8-pagine)
9. [Admin Panel](#9-admin-panel)
10. [Come modificare...](#10-come-modificare)
11. [API Reference](#11-api-reference)

---

## 1. Architettura generale

### Stack tecnologico

| Tecnologia | Versione | Ruolo |
|------------|---------|-------|
| **Next.js** | 16.x | Frontend — App Router, Server Components, pagine e routing |
| **NestJS** | 11.x | Backend — API REST, moduli, controller, servizi |
| **PostgreSQL** | 16 | Database — dati persistenti |
| **Prisma** | 6.x | ORM — schema database, migrazioni, query typesafe |
| **TypeScript** | 5.x | Linguaggio — sia frontend che backend |

### Struttura cartelle

```
serviform-academy/
│
├── apps/
│   ├── api/                    ← Backend NestJS
│   │   ├── src/
│   │   │   ├── auth/           ← Autenticazione JWT
│   │   │   ├── courses/        ← Gestione corsi/moduli
│   │   │   ├── units/          ← Unità didattiche
│   │   │   ├── videos/         ← Video pillole YouTube
│   │   │   ├── exercises/      ← Esercitazioni con file
│   │   │   ├── events/         ← Calendario eventi
│   │   │   ├── pricing/        ← Listino prezzi
│   │   │   ├── software/       ← Software (EngView, Sysform, ProjectO)
│   │   │   ├── guides/         ← Guide Zendesk
│   │   │   ├── progress/       ← Tracciamento progresso
│   │   │   ├── certificates/   ← Attestati di completamento
│   │   │   ├── sync/           ← Import da fonti esterne
│   │   │   ├── common/         ← Filtri e utilità condivise
│   │   │   ├── prisma/         ← Client database condiviso
│   │   │   └── main.ts         ← Entry point dell'applicazione
│   │   └── prisma/
│   │       ├── schema.prisma   ← Schema database
│   │       └── seed.ts         ← Dati iniziali
│   │
│   └── web/                    ← Frontend Next.js
│       └── src/
│           ├── app/            ← Pagine (App Router)
│           │   ├── page.tsx            ← Homepage
│           │   ├── layout.tsx          ← Layout root
│           │   ├── videos/             ← Pagina video pillole
│           │   ├── consulting/         ← Pagina consulenza
│           │   ├── events/             ← Pagina eventi
│           │   ├── pricing/            ← Pagina listino
│           │   ├── courses/[slug]/     ← Dettaglio corso
│           │   ├── courses/[slug]/[unit]/ ← Dettaglio unità
│           │   ├── auth/               ← Login e registrazione
│           │   └── admin/              ← Pannello amministrazione
│           │
│           ├── components/
│           │   ├── layout/     ← Topbar, Rail, Shell
│           │   ├── ui/         ← CourseCard, VideoCard, Hero, etc.
│           │   └── features/   ← AdminCrud, ExerciseCard
│           │
│           ├── context/        ← AuthContext, ProgressContext
│           ├── lib/            ← API client, configurazione brands
│           └── styles/         ← CSS globale, responsive
│
├── docs/                       ← Documentazione
└── infra/                      ← Docker, configurazione deploy
```

### Flusso dei dati

```
Utente (Browser)
    ↓
Next.js Frontend (localhost:3000)
    ↓ fetch API
NestJS Backend (localhost:3001)
    ↓ Prisma ORM
PostgreSQL Database (localhost:5432)
```

---

## 2. Come avviare il progetto

### Prerequisiti
- Node.js 20+
- pnpm (package manager)
- PostgreSQL in esecuzione

### Avvio backend
```bash
cd apps/api
cp .env.example .env        # configura DATABASE_URL
pnpm install
npx prisma migrate dev      # applica schema al database
npx prisma db seed          # popola con dati iniziali
pnpm start:dev              # avvia su localhost:3001
```

### Avvio frontend
```bash
cd apps/web
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
pnpm install
pnpm dev                    # avvia su localhost:3000
```

---

## 3. Backend (NestJS)

### Come funziona NestJS

NestJS organizza il codice in **moduli**. Ogni modulo ha:
- **Controller** — riceve le richieste HTTP (GET, POST, PUT, DELETE)
- **Service** — contiene la logica di business (query database, validazioni)
- **Module** — registra controller e service nel sistema

### Elenco moduli

| Modulo | Controller | Service | Endpoint base | Descrizione |
|--------|-----------|---------|---------------|-------------|
| `AuthModule` | `auth.controller.ts` | `auth.service.ts` | `/auth` | Login, registrazione, JWT |
| `CoursesModule` | `courses.controller.ts` | `courses.service.ts` | `/courses` | CRUD moduli formativi |
| `UnitsModule` | `units.controller.ts` | `units.service.ts` | `/units` | CRUD unità didattiche |
| `VideosModule` | `videos.controller.ts` | `videos.service.ts` | `/videos` | CRUD video pillole |
| `ExercisesModule` | `exercises.controller.ts` | `exercises.service.ts` | `/exercises` | CRUD esercitazioni |
| `EventsModule` | `events.controller.ts` | `events.service.ts` | `/events` | CRUD eventi calendario |
| `PricingModule` | `pricing.controller.ts` | `pricing.service.ts` | `/pricing` | CRUD pacchetti listino |
| `SoftwareModule` | `software.controller.ts` | `software.service.ts` | `/software` | Gestione software |
| `GuidesModule` | `guides.controller.ts` | `guides.service.ts` | `/guides` | Guide Zendesk |
| `ProgressModule` | `progress.controller.ts` | `progress.service.ts` | `/progress` | Tracciamento completamento |
| `CertificatesModule` | `certificates.controller.ts` | `certificates.service.ts` | `/certificates` | Emissione attestati |

### File: `main.ts`

Entry point dell'applicazione. Configura:

```
ValidationPipe   → valida automaticamente i dati in ingresso
HttpExceptionFilter → formatta tutti gli errori in modo uniforme
CORS → permette al frontend di comunicare con il backend
Porta → legge da variabile d'ambiente PORT (default: 3001)
```

**Come modificare la porta:** cambia `PORT=3001` nel file `.env` del backend.

### File: `common/filters/http-exception.filter.ts`

Intercetta TUTTI gli errori dell'applicazione e li formatta così:

```json
{
  "statusCode": 400,
  "message": "Il titolo deve avere almeno 3 caratteri",
  "error": "Bad Request",
  "path": "/courses",
  "timestamp": "2026-03-19T10:30:00Z"
}
```

**Perché serve:** senza questo filtro, errori diversi avrebbero formati diversi, rendendo difficile la gestione lato frontend.

### File: `app.module.ts`

Registra tutti i moduli dell'applicazione. Se aggiungi un nuovo modulo:

1. Crea la cartella con controller, service, module
2. Aggiungi l'import in `app.module.ts`
3. Aggiungi il modulo nell'array `imports`

---

## 4. Database (Prisma)

### File: `prisma/schema.prisma`

Definisce la struttura del database. Ogni `model` corrisponde a una tabella.

| Modello | Campi principali | Relazioni | Note |
|---------|-----------------|-----------|------|
| `User` | email, name, passwordHash, role | → progress, certificates | Ruoli: USER, ADMIN, TEAM_ADMIN |
| `Software` | name, slug, color, tagline | → courses, videos | 3 fissi: EngView, Sysform, ProjectO |
| `Course` | title, slug, level, duration, available | → software, units, certificates | Soft delete con deletedAt |
| `Unit` | title, slug, order, content (HTML), unitType | → course, guide, exercises, progress | Tipi: OVERVIEW, LESSON, EXERCISE |
| `GuideReference` | zendeskId, title, url | → unit (1:1) | Link a support.serviform.com |
| `Exercise` | title, description, htmlUrl, evdUrl | → unit | Anteprima 3D + file .evd |
| `VideoPill` | title, youtubeId, description | → software | Video YouTube per software |
| `Certificate` | userId, courseId, issuedAt | → user, course | Unico per utente+corso |
| `UserProgress` | userId, unitId, completed | → user, unit | Unico per utente+unità |
| `Event` | title, date, eventType, maxSeats | — | Tipi: WORKSHOP, WEBINAR, LIVE_SESSION |
| `PricingPackage` | name, slug, price, features[] | — | Pacchetti del listino |

### Come aggiungere un campo a una tabella

1. Modifica `prisma/schema.prisma` aggiungendo il campo
2. Esegui `npx prisma migrate dev --name descrizione_modifica`
3. Prisma aggiorna il database e rigenera il client

### Come aggiungere una nuova tabella

1. Aggiungi il `model` in `schema.prisma`
2. Crea il modulo NestJS (controller + service + module)
3. Registra il modulo in `app.module.ts`
4. Esegui `npx prisma migrate dev --name nuova_tabella`

### File: `prisma/seed.ts`

Popola il database con dati iniziali. Contiene:

- 3 software (EngView blu, Sysform rosso, ProjectO azzurro)
- 5 corsi con metadata completi
- 11 unità con contenuto HTML per il modulo 3D
- 9 guide Zendesk con URL reali
- 3 esercitazioni di esempio
- 9 video pillole con YouTube ID reali
- 5 pacchetti listino prezzi
- 3 eventi di esempio

**Come rieseguire il seed:** `npx prisma db seed`

---

## 5. Frontend (Next.js)

### App Router

Next.js usa il file system per il routing. Ogni file `page.tsx` in una cartella diventa una pagina:

| File | URL | Tipo |
|------|-----|------|
| `app/page.tsx` | `/` | Server Component |
| `app/videos/page.tsx` | `/videos` | Server Component |
| `app/consulting/page.tsx` | `/consulting` | Server Component |
| `app/events/page.tsx` | `/events` | Server Component |
| `app/pricing/page.tsx` | `/pricing` | Server Component |
| `app/courses/[slug]/page.tsx` | `/courses/engview-3d` | Server Component |
| `app/courses/[slug]/[unit]/page.tsx` | `/courses/engview-3d/azioni-piega` | Server Component |
| `app/auth/login/page.tsx` | `/auth/login` | Client Component |
| `app/admin/page.tsx` | `/admin` | Server Component |
| `app/admin/courses/page.tsx` | `/admin/courses` | Client Component |

**Server Component:** carica i dati sul server, non ha interattività
**Client Component:** ha `'use client'` in cima, può usare useState, onClick, etc.

### File: `app/layout.tsx`

Il layout root che wrappa TUTTE le pagine. Include:
- Caricamento font (Syne, DM Sans, DM Mono)
- AuthProvider (gestione login/logout)
- ProgressProvider (tracciamento completamento unità)
- Topbar (barra navigazione in alto)
- Rail (barra icone a sinistra)
- Shell (wrapper che aggiunge padding per topbar e rail)
- Import CSS globale e responsive

### File: `lib/api.ts`

Client centralizzato per tutte le chiamate al backend. Ogni endpoint ha un metodo:

```typescript
api.courses.findAll()           // GET /courses
api.courses.findBySlug('x')     // GET /courses/x
api.courses.create({...})       // POST /courses
api.courses.update('id', {...}) // PUT /courses/id
api.courses.remove('id')        // DELETE /courses/id
```

**Come cambiare l'URL del backend:** modifica `NEXT_PUBLIC_API_URL` nel file `.env.local`

### File: `lib/brands.ts`

Configurazione colori per i 3 software:

```
EngView:  color=#003875 (blu scuro),  light=#EEF3FA
Sysform:  color=#C8102E (rosso),      light=#FDF0EF
ProjectO: color=#067DB8 (azzurro),    light=#E3F4FC
```

**Come cambiare un colore software:** modifica i valori in questo file E nel seed (per coerenza con il database).

---

## 6. Design System

### File: `styles/globals.css`

Contiene TUTTE le variabili CSS (design tokens) usate in tutto il progetto.

#### Colori

```css
--red: #C8102E;          /* Rosso Serviform — colore primario brand */
--red-dark: #9E0B24;     /* Rosso scuro — hover dei bottoni */
--red-mid: #E8243E;      /* Rosso medio — accenti */
--red-light: #FDF0EF;    /* Rosso chiaro — sfondi leggeri */
--coal: #111111;          /* Quasi nero — topbar, hero, sfondi scuri */
--ink: #1E1E1E;           /* Nero morbido — testo principale */
--muted: #6B6B6B;         /* Grigio — testo secondario, label */
--border: #E4E4E4;        /* Grigio chiaro — bordi card e divisori */
--surface: #FAFAFA;        /* Grigio sfondo — background pagine */
--white: #FFFFFF;          /* Bianco — card, form, contenuto */
```

**Come cambiare il colore primario:** modifica `--red` e tutte le sue varianti (`--red-dark`, `--red-mid`, `--red-light`, `--red-glow`).

#### Font

```css
--font-display: 'Syne';    /* Titoli, heading — bold e impattante */
--font-body: 'DM Sans';    /* Testo, UI — leggibile e pulito */
--font-mono: 'DM Mono';    /* Badge, numeri, codice — monospazio */
```

**Come cambiare un font:** modifica la variabile CSS qui E l'import in `layout.tsx` (usa `next/font/google`).

#### Layout

```css
--topbar-h: 52px;     /* Altezza barra navigazione superiore */
--sidebar-w: 280px;   /* Larghezza sidebar nel dettaglio unità */
--rail-w: 64px;       /* Larghezza barra icone laterale */
```

#### Bordi e ombre

```css
--r: 10px;            /* Border radius standard */
--r-lg: 16px;         /* Border radius grande (card) */
--shadow-sm/md/lg;    /* 3 livelli di ombra */
```

### File: `styles/responsive.css`

Media queries per tablet (≤1024px) e mobile (≤768px):

- **Tablet:** la rail laterale scompare, il contenuto si allarga
- **Mobile:** griglie a colonna singola, padding ridotti, sidebar diventa orizzontale

---

## 7. Componenti

### Layout

| Componente | File | Scopo |
|-----------|------|-------|
| `Topbar` | `components/layout/Topbar.tsx` | Barra navigazione fissa in alto. Logo, link sezioni, link assistenza, CTA listino |
| `Rail` | `components/layout/Rail.tsx` | Barra icone fissa a sinistra. Icone per ogni sezione + link Zendesk |
| `Shell` | `components/layout/Shell.tsx` | Wrapper che applica padding-top e padding-left per non coprire topbar e rail |

**Come aggiungere una voce di navigazione:**
1. In `Topbar.tsx`: aggiungi un oggetto nell'array `NAV`
2. In `Rail.tsx`: aggiungi un oggetto nell'array `ITEMS` con icona SVG
3. Crea la pagina corrispondente in `app/nuova-sezione/page.tsx`

### UI

| Componente | File | Props principali | Scopo |
|-----------|------|-----------------|-------|
| `Hero` | `ui/Hero.tsx` | courseCount, videoCount, guideCount, hoursCount | Sezione hero homepage con statistiche animate |
| `CourseCard` | `ui/CourseCard.tsx` | slug, title, description, softwareSlug, level | Card nella griglia dei moduli |
| `VideoCard` | `ui/VideoCard.tsx` | title, youtubeId, softwareSlug, onClick | Card nella griglia video pillole |
| `SoftwareTag` | `ui/SoftwareTag.tsx` | slug, size | Badge colorato con nome software |
| `Chip` | `ui/Chip.tsx` | label, active, color, onClick | Chip filtro per software |
| `FilterBar` | `ui/FilterBar.tsx` | options, onChange | Barra filtri sticky con chip |
| `VideoModal` | `ui/VideoModal.tsx` | youtubeId, title, onClose | Modal overlay per player YouTube |
| `ProgressBar` | `ui/ProgressBar.tsx` | percent, label | Barra progresso con percentuale |

### Features

| Componente | File | Scopo |
|-----------|------|-------|
| `AdminCrud` | `features/AdminCrud.tsx` | Componente CRUD riutilizzabile per l'admin: tabella + form modale |
| `ExerciseCard` | `features/ExerciseCard.tsx` | Card esercitazione: espandibile con iframe HTML 3D + download .evd |

---

## 8. Pagine

### Homepage (`/`)
- Hero con 4 statistiche
- FilterBar per filtrare moduli per software
- Griglia CourseCard

### Video Pillole (`/videos`)
- Hero con titolo
- Tab per software (EngView, Sysform, ProjectO)
- Video featured + griglia archivio
- Modal player YouTube

### Consulenza (`/consulting`)
- Hero con descrizione servizio
- 3 card servizi (Analisi, Ottimizzazione, Troubleshooting)
- CTA con email a support@serviform.com

### Eventi (`/events`)
- Lista eventi futuri con data, tipo, posti, iscrizione
- Archivio eventi passati con link registrazione

### Listino Prezzi (`/pricing`)
- Card dinamiche dai pacchetti nel database
- Sezione contatto per pacchetti personalizzati

### Dettaglio Corso (`/courses/[slug]`)
- Panoramica con obiettivi e lista unità
- 3 azioni: "Inizia modulo", "Richiedi formatore", "Guide Zendesk"

### Dettaglio Unità (`/courses/[slug]/[unit]`)
- Sidebar con lista unità e progresso
- Contenuto HTML ricco
- Link guida Zendesk
- Esercitazioni con iframe HTML 3D + download .evd
- Navigazione precedente/successivo

---

## 9. Admin Panel

Accessibile su `/admin`. Gestisce TUTTE le entità della piattaforma.

### Come funziona il componente AdminCrud

`AdminCrud` è un componente generico che riceve:

- `fetchItems` — funzione per caricare la lista
- `formFields` — definizione dei campi del form
- `onSave` / `onUpdate` / `onDelete` — funzioni CRUD

I campi `select` possono avere `loadOptions` per caricare le opzioni dal backend (es. lista software).

### Sezioni admin

| Sezione | Caratteristica speciale |
|---------|------------------------|
| Software | Solo modifica (non eliminabile) |
| Corsi | Dropdown software invece di UUID |
| Unità | **Raggruppate per corso** — selezioni prima il corso, poi gestisci le sue unità |
| Video | Dropdown software |
| Esercitazioni | Dropdown unità di tipo EXERCISE |
| Eventi | Campo data con formato specifico |
| Listino | Feature separate da newline |

---

## 10. Come modificare...

### ...i colori del brand

1. Apri `apps/web/src/styles/globals.css`
2. Modifica le variabili `--red` e derivate
3. Se cambi i colori dei software, modifica anche `apps/web/src/lib/brands.ts`

### ...i font

1. Apri `apps/web/src/app/layout.tsx`
2. Cambia gli import da `next/font/google`
3. Aggiorna le variabili CSS in `globals.css` (`--font-display`, `--font-body`, `--font-mono`)

### ...la navigazione

1. **Topbar:** modifica l'array `NAV` in `components/layout/Topbar.tsx`
2. **Rail:** modifica l'array `ITEMS` in `components/layout/Rail.tsx`
3. **Crea la pagina:** aggiungi `app/nuova-pagina/page.tsx`

### ...le dimensioni del layout

Modifica in `globals.css`:
- `--topbar-h: 52px` per l'altezza della topbar
- `--rail-w: 64px` per la larghezza della rail
- `--sidebar-w: 280px` per la sidebar nel dettaglio unità

### ...aggiungere un nuovo modulo backend

1. Crea cartella `apps/api/src/nuovo-modulo/`
2. Crea: `nuovo-modulo.module.ts`, `nuovo-modulo.controller.ts`, `nuovo-modulo.service.ts`
3. Aggiungi il model in `prisma/schema.prisma`
4. Registra in `apps/api/src/app.module.ts`
5. Esegui `npx prisma migrate dev --name aggiungi_nuovo_modulo`

### ...aggiungere un endpoint API

1. Apri il controller del modulo (es. `courses.controller.ts`)
2. Aggiungi il metodo con il decoratore (`@Get()`, `@Post()`, `@Put()`, `@Delete()`)
3. Implementa la logica nel service corrispondente
4. Aggiorna `lib/api.ts` nel frontend con il nuovo endpoint

### ...aggiungere un campo al form admin

Apri la pagina admin del modulo (es. `admin/courses/page.tsx`) e aggiungi un oggetto nell'array `formFields`:

```typescript
{ key: 'nuovoCampo', label: 'Nuovo Campo', type: 'text', placeholder: 'Esempio...' }
```

Tipi disponibili: `text`, `textarea`, `number`, `select`, `richtext`

Per select con opzioni dal database usa `loadOptions`:
```typescript
{ key: 'softwareId', label: 'Software', type: 'select',
  loadOptions: async () => {
    const list = await api.software.findAll()
    return list.map(s => ({ value: s.id, label: s.name }))
  }
}
```

---

## 11. API Reference

Base URL: `http://localhost:3001`

### Auth
| Metodo | Endpoint | Body | Descrizione |
|--------|----------|------|-------------|
| POST | `/auth/register` | `{ email, password, name? }` | Registrazione |
| POST | `/auth/login` | `{ email, password }` | Login → JWT |
| GET | `/auth/profile` | Header: `Authorization: Bearer TOKEN` | Profilo utente |

### Courses
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/courses` | Lista tutti i corsi |
| GET | `/courses/:slug` | Dettaglio corso con unità |
| POST | `/courses` | Crea corso |
| PUT | `/courses/:id` | Modifica corso |
| DELETE | `/courses/:id` | Elimina corso (soft delete) |

### Units
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/units/course/:courseId` | Unità di un corso |
| GET | `/units/:courseSlug/:unitSlug` | Dettaglio unità |
| POST | `/units` | Crea unità |
| PUT | `/units/:id` | Modifica unità |
| DELETE | `/units/:id` | Elimina unità (soft delete) |

### Videos
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/videos` | Tutte le video pillole |
| GET | `/videos/software/:slug` | Video per software |
| POST | `/videos` | Crea video |
| PUT | `/videos/:id` | Modifica video |
| DELETE | `/videos/:id` | Elimina video |

### Exercises
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/exercises/unit/:unitId` | Esercizi di un'unità |
| POST | `/exercises` | Crea esercizio |
| PUT | `/exercises/:id` | Modifica esercizio |
| DELETE | `/exercises/:id` | Elimina esercizio |

### Events
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/events` | Tutti gli eventi |
| GET | `/events/upcoming` | Eventi futuri |
| GET | `/events/past` | Eventi passati |
| POST | `/events` | Crea evento |
| PUT | `/events/:id` | Modifica evento |
| DELETE | `/events/:id` | Elimina evento |

### Pricing
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/pricing` | Tutti i pacchetti attivi |
| POST | `/pricing` | Crea pacchetto |
| PUT | `/pricing/:id` | Modifica pacchetto |
| DELETE | `/pricing/:id` | Elimina pacchetto |

### Software
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/software` | Lista software |
| GET | `/software/:slug` | Dettaglio software |
| POST | `/software` | Crea software |
| PUT | `/software/:id` | Modifica software |

### Progress
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/progress/complete` | Body: `{ userId, unitId }` — segna completata |
| GET | `/progress/:userId/course/:courseSlug` | Progresso su un corso |

### Certificates
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/certificates/issue` | Body: `{ userId, courseSlug }` — emetti attestato |

### Formato errori

Tutte le risposte di errore seguono questo formato:
```json
{
  "statusCode": 400,
  "message": ["campo obbligatorio"],
  "error": "Bad Request",
  "path": "/courses",
  "timestamp": "2026-03-19T..."
}
```
