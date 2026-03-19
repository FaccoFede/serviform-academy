# Serviform Academy — Architettura

## Stack

| Layer | Tecnologia | Versione |
|-------|-----------|----------|
| Frontend | Next.js (App Router) | 16.x |
| Backend | NestJS | 11.x |
| Database | PostgreSQL | 16 |
| ORM | Prisma | 6.x |
| Auth | JWT + bcrypt + Passport | - |
| Deploy | Docker / Vercel | - |

## Struttura Monorepo

```
serviform-academy/
├── apps/
│   ├── api/           → Backend NestJS
│   │   ├── src/
│   │   │   ├── auth/         → Autenticazione JWT
│   │   │   ├── common/       → Filtri, guard, pipe globali
│   │   │   ├── courses/      → Gestione corsi
│   │   │   ├── units/        → Unità didattiche
│   │   │   ├── videos/       → Video pillole
│   │   │   ├── software/     → Prodotti Serviform
│   │   │   ├── guides/       → Guide Zendesk
│   │   │   ├── progress/     → Tracciamento progresso
│   │   │   ├── certificates/ → Certificati completamento
│   │   │   ├── sync/         → Import da fonti esterne
│   │   │   └── prisma/       → Client database
│   │   └── prisma/
│   │       ├── schema.prisma → Schema database
│   │       └── seed.ts       → Dati iniziali
│   │
│   └── web/           → Frontend Next.js
│       └── src/
│           ├── app/          → Pagine (App Router)
│           ├── components/
│           │   ├── layout/   → Topbar, Rail, Shell
│           │   ├── ui/       → CourseCard, VideoCard, Chip...
│           │   └── features/ → UnitContent (content blocks)
│           ├── context/      → AuthContext, ProgressContext
│           ├── lib/          → API client, brands config
│           └── styles/       → Design system CSS
│
├── docs/              → Documentazione
└── infra/             → Docker, deploy config
```

## Database Schema

Modelli: User (con ruoli), Software, Course, Unit (con contentBlocks JSON),
GuideReference, VideoPill, Certificate, UserProgress.

Soft delete su: User, Software, Course, Unit.

## Autenticazione

- POST /auth/register → crea utente, restituisce JWT
- POST /auth/login → verifica credenziali, restituisce JWT
- GET /auth/profile → profilo utente (richiede Bearer token)

Ruoli: USER, ADMIN, TEAM_ADMIN.
Guard: JwtAuthGuard (autenticazione), RolesGuard (autorizzazione).

## Content Blocks

Le unità salvano il contenuto in un campo JSON `contentBlocks`.
Tipi supportati: text, list, steps, callout, props, image, objectives, checklist.
Il componente React `UnitContent` renderizza i blocchi dinamicamente.
